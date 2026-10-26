// The five pipeline stages, in flow order. Story frontmatter `stage` must be one of these keys.
// Descriptions stay generic on purpose (see the confidentiality rule in CLAUDE.md).
//
// `sample` is one INVENTED order line (order 4471, line 2) as it looks at that stage.
// The update changes qty 2 -> 3; text wrapped in [[ ]] is highlighted so the reader can follow it.
// `format` is the small label shown above each sample.
export const stages = [
	{
		key: 'source',
		label: 'Source',
		system: 'Mainframe',
		detail: 'CDC from IMS, Db2, VSAM',
		format: 'fixed-width change record · 54 bytes · EBCDIC',
		sample: `CDC change record   op=U (UPDATE)   captured 2026-10-26 14:32:05.118

----+----1----+----2----+----3----+----4----+----5----
U00004471002WX-2210-BLU [[00003]]000001850OP20261026143205
||       |  |           |    |        | |
OP       LINE           QTY           ST
 ORDER      SKU              PRICE      UPDATED

PRICE is PIC 9(7)V99: 000001850 means 18.50`,
	},
	{
		key: 'queue',
		label: 'Queue',
		system: 'IBM MQ',
		detail: 'store-and-forward messaging',
		format: 'MQMD v2 header · 364 bytes + 54-byte payload',
		sample: `MQMD
  StrucId         MD
  Version         2
  MsgType         8 (DATAGRAM)
  Format          MQSTR
  Persistence     1 (PERSISTENT)
  Priority        4
  CodedCharSetId  37 (EBCDIC)
  MsgId           7f3a91c40e2b5d68a1c09e44b3f27d15a8c6e0913b4d2f70
  PutDate         20261026
  PutTime         14320512

payload (54 bytes)
U00004471002WX-2210-BLU [[00003]]000001850OP20261026143205`,
	},
	{
		key: 'process',
		label: 'Process',
		system: 'Java services',
		detail: 'split, transform, apply',
		format: 'JSON from the splitter · UTF-8 · typed fields',
		sample: `{
  "op": "UPDATE",
  "table": "ORDER_LINE",
  "key": { "orderId": 4471, "lineNo": 2 },
  "after": {
    "sku": "WX-2210-BLU",
    [["qty": 3]],
    "unitPrice": 18.50,
    "status": "OPEN",
    "updatedAt": "2026-10-26T14:32:05Z"
  },
  "source": {
    "capturedAt": "2026-10-26T14:32:05.118Z",
    "msgId": "7f3a91c40e2b5d68…"
  }
}`,
	},
	{
		key: 'store',
		label: 'Store',
		system: 'Oracle',
		detail: 'three operational instances',
		format: 'MERGE into ORDER_LINE · 1 row',
		sample: `MERGE INTO order_line t
USING (SELECT 4471 order_id, 2 line_no FROM dual) s
   ON (t.order_id = s.order_id AND t.line_no = s.line_no)
 WHEN MATCHED THEN UPDATE SET [[t.qty = 3]], t.updated_at = :ts;

1 row merged.

ORDER_ID  LINE_NO  SKU          QTY  UNIT_PRICE  STATUS  UPDATED_AT
--------  -------  -----------  ---  ----------  ------  -------------------
    4471        2  WX-2210-BLU    [[3]]       18.50  OPEN    2026-10-26 14:32:05`,
	},
	{
		key: 'consume',
		label: 'Consume',
		system: 'Pub/Sub',
		detail: 'cloud and downstream teams',
		format: 'Pub/Sub pull message · base64 data + attributes',
		sample: `{
  "ackId": "RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIJB08CKF15MEorQV5…",
  "message": {
    "attributes": { "op": "UPDATE", "table": "ORDER_LINE", "orderId": "4471" },
    "orderingKey": "4471",
    "messageId": "9184736251048",
    "publishTime": "2026-10-26T14:32:06.402Z",
    "data": "eyJvcmRlcklkIjo0NDcxLCJsaW5lTm8iOjIsInNrdSI6IldYLTIyMTAtQkxVIiwicXR5IjozLCJ1bml0UHJpY2UiOjE4LjUsInN0YXR1cyI6Ik9QRU4iLCJ1cGRhdGVkQXQiOiIyMDI2LTEwLTI2VDE0OjMyOjA1WiJ9"
  }
}

data, decoded:
{"orderId":4471,"lineNo":2,"sku":"WX-2210-BLU",[["qty":3]],"unitPrice":18.5,
 "status":"OPEN","updatedAt":"2026-10-26T14:32:05Z"}`,
	},
] as const;

// The same Source record as it once arrived corrupt: uneven line breaks inside one message (see the one-bad-message story).
export const corruptSource = `U00004471002WX-22
10-BLU 0000300000
1850OP2026
1026143205`;

export type StageKey = (typeof stages)[number]['key'];
export const stageKeys = stages.map((s) => s.key) as [StageKey, ...StageKey[]];
