// The five pipeline stages, in flow order. Story frontmatter `stage` must be one of these keys.
// Descriptions stay generic on purpose (see the confidentiality rule in CLAUDE.md).
//
// `sample` is one INVENTED order line (order 4471, line 2) as it looks at that stage.
// The update changes qty 2 -> 3; text wrapped in [[ ]] is highlighted so the reader can follow it.
// `format` is the small label shown above each sample. Every value is illustrative but self-consistent:
// the 54-byte layout matches its ruler, and the Pub/Sub base64 decodes to the JSON shown (asserted below).

// The record as the broker publishes it (stage 3 shows it pretty-printed, stage 5 base64-encodes it).
const published = {
	op: 'UPDATE',
	table: 'ORDER_LINE',
	key: { orderId: 4471, lineNo: 2 },
	before: { qty: 2 },
	after: { sku: 'WX-2210-BLU', qty: 3, unitPrice: '18.50', status: 'OPEN', updatedAt: '2026-10-26T21:32:05Z' },
	sourceSeq: 88213904417,
	capturedAt: '2026-10-26T21:32:05.118Z',
};
const compact = JSON.stringify(published);
const data = Buffer.from(compact, 'utf8').toString('base64');
if (JSON.stringify(JSON.parse(Buffer.from(data, 'base64').toString('utf8'))) !== compact) throw new Error('stages.ts: Pub/Sub data does not decode to the JSON shown');
// pretty-printed with the two small objects kept on one line (still valid JSON)
const pretty = JSON.stringify(published, null, 2)
	.replace(/\{\n\s+("orderId": 4471),\n\s+("lineNo": 2)\n\s+\}/, '{ $1, $2 }')
	.replace(/\{\n\s+("qty": 2)\n\s+\}/, '{ $1 }');
if (JSON.stringify(JSON.parse(pretty)) !== compact) throw new Error('stages.ts: stage 3 JSON differs from the published record');
const markQty = (json: string) => json.replace(/"qty": ?[23]/g, (m) => `[[${m}]]`);

export const stages = [
	{
		key: 'source',
		label: 'Source',
		system: 'Mainframe',
		detail: 'CDC from IMS, Db2, VSAM',
		format: 'fixed-width change record · before + after image · 54 bytes each · EBCDIC',
		sample: `CDC change record   op=U (UPDATE)   captured 2026-10-26 14:32:05.118 local time (UTC-7)

----+----1----+----2----+----3----+----4----+----5----
B00004471002WX-2210-BLU [[00002]]000001850OP20261026142810
A00004471002WX-2210-BLU [[00003]]000001850OP20261026143205
||       |  |           |    |        | |
IMG      LINE           QTY           ST
 ORDER      SKU              PRICE      UPDATED

IMG is B (before image) or A (after image)
PRICE is PIC 9(7)V99: 000001850 means 18.50`,
	},
	{
		key: 'queue',
		label: 'Queue',
		system: 'IBM MQ',
		detail: 'store-and-forward messaging',
		format: 'MQMD v2 header · 364 bytes + 108-byte payload',
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
  PutTime         21320512 (UTC)

payload (108 bytes: before + after image)
B00004471002WX-2210-BLU [[00002]]000001850OP20261026142810
A00004471002WX-2210-BLU [[00003]]000001850OP20261026143205

payload shown converted from CCSID 37 (EBCDIC) for reading`,
	},
	{
		key: 'process',
		label: 'Process',
		system: 'Java services',
		detail: 'split, transform, apply',
		format: 'the record as structured JSON (the shape the broker publishes) · UTF-8 · typed fields',
		sample: `${markQty(pretty)}

capturedAt and updatedAt: local 14:32 (UTC-7) converted to UTC
unitPrice is a decimal string: it keeps the exact two decimals of PIC 9(7)V99`,
	},
	{
		key: 'store',
		label: 'Store',
		system: 'Oracle',
		detail: 'three operational instances',
		format: 'MERGE into ORDER_LINE · 1 row',
		sample: `MERGE INTO order_line t
USING (SELECT 4471 order_id, 2 line_no, 'WX-2210-BLU' sku, [[3 qty]], 18.50 unit_price,
              'OPEN' status, TIMESTAMP '2026-10-26 14:32:05' updated_at,
              88213904417 src_seq
         FROM dual) s
   ON (t.order_id = s.order_id AND t.line_no = s.line_no)
 WHEN MATCHED THEN UPDATE
      SET t.qty = s.qty, t.updated_at = s.updated_at, t.src_seq = s.src_seq
      WHERE t.src_seq < s.src_seq          -- never apply an older change over a newer one
 WHEN NOT MATCHED THEN INSERT
      (order_id, line_no, sku, qty, unit_price, status, updated_at, src_seq)
      VALUES (s.order_id, s.line_no, s.sku, s.qty, s.unit_price, s.status, s.updated_at, s.src_seq);

1 row merged.

ORDER_ID  LINE_NO  SKU          QTY  UNIT_PRICE  STATUS  UPDATED_AT           SRC_SEQ
--------  -------  -----------  ---  ----------  ------  -------------------  -----------
    4471        2  WX-2210-BLU     [[3]]       18.50  OPEN    2026-10-26 14:32:05  88213904417`,
	},
	{
		key: 'consume',
		label: 'Consume',
		system: 'Pub/Sub',
		detail: 'Java broker → Pub/Sub → cloud consumers',
		format: 'Pub/Sub pull message · base64 data + attributes',
		sample: `{
  "ackId": "RVNEUAYWLF1GSFE3GQhoUQ5PXiM_NSAoRRIJB08CKF15MEorQV5…",
  "message": {
    "data": "${data}",
    "attributes": {
      "op": "UPDATE",
      "table": "ORDER_LINE",
      "sourceSeq": "88213904417",
      "capturedAt": "2026-10-26T21:32:05.118Z",
      "msgId": "7f3a91c4…"
    },
    "orderingKey": "4471",
    "messageId": "9184736251048",
    "publishTime": "2026-10-26T21:32:06.402Z"
  }
}

data, decoded:
${markQty(compact)}`,
	},
] as const;

// The same Source record as it once arrived corrupt: uneven line breaks inside one message (see the one-bad-message story).
export const corruptSource = `A00004471002WX-22
10-BLU 0000300000
1850OP2026
1026143205`;

export type StageKey = (typeof stages)[number]['key'];
export const stageKeys = stages.map((s) => s.key) as [StageKey, ...StageKey[]];
