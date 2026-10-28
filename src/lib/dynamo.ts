// Simple Dynamo ring explainer (/projects/simple-dynamo/). Faithful to SimpleDynamoProvider.java
// (see the appendix of docs/plans/2026-10-28-portfolio-v2.md): SHA-1 of each emulator's port,
// sorted into a ring; a key's coordinator is the first node hash >= the key hash, wrapping around;
// the node where put() is called writes to the coordinator and its 2 successors in turn, buffering
// any write that gets no ack in `failedavd`; reads fall back to coordinator + 2.
import { createHash } from 'node:crypto';

const sha1 = (s: string) => createHash('sha1').update(s).digest('hex');
export const short = (h: string) => h.slice(0, 8);

export const ring = ['5554', '5556', '5558', '5560', '5562'].map((port) => ({ port, hash: sha1(port) })).sort((a, b) => (a.hash < b.hash ? -1 : 1));
const ports = ring.map((n) => n.port);
const hashOf = (p: string) => short(ring[ports.indexOf(p)].hash);

export const KEY = 'cherry';
export const VALUE = 'red';
export const keyHash = sha1(KEY);
const ci = Math.max(0, ring.findIndex((n) => n.hash >= keyHash)); // -1 = past the last node: wrap to the first
export const keyAfter = (ci + ring.length - 1) % ring.length; // ring index the key sits just after
const [coord, succ1, succ2] = [0, 1, 2].map((d) => ports[(ci + d) % ports.length]);
export const ORIGIN = '5554';
if ([coord, succ1, succ2].includes(ORIGIN)) throw new Error('dynamo.ts: the story assumes put() arrives at a non-replica');

export type Msg = { from: string; to: string; kind: 'send' | 'ack' | 'fail' | 'alive' | 'reply' };
export interface Step {
	title: string;
	caption: string;
	lit?: string[];
	down?: string[];
	copies?: string[];
	buffer?: boolean; // the origin holds a buffered write
	msgs?: Msg[];
}
export interface Scenario {
	id: string;
	name: string;
	title: string;
	note?: string;
	op: 'put' | 'get';
	steps: Step[];
}

const kv = `${KEY}:${VALUE}`;
const peers = ports.filter((p) => p !== succ1);

export const scenarios: Scenario[] = [
	{
		id: 'a',
		name: 'Scenario A',
		title: `put(${KEY}): hash, find the coordinator, write three copies`,
		op: 'put',
		steps: [
			{
				title: 'Hash the key',
				caption: `put("${KEY}", "${VALUE}") is called on node ${ORIGIN}. It hashes the key with SHA-1: ${short(keyHash)}…, the same hash used to place the nodes on the ring.`,
				lit: [ORIGIN],
			},
			{
				title: `Find the coordinator: ${coord}`,
				caption: `Walk the ring in hash order. The first node whose hash is at or above ${short(keyHash)}… is ${coord} (${hashOf(coord)}…), so ${coord} coordinates this key. A key hashed above every node wraps around to ${ports[0]}.`,
				lit: [ORIGIN, coord],
			},
			{
				title: `Write to the coordinator ${coord}, wait for the ack`,
				caption: `${ORIGIN} sends ${kv} to ${coord} over a TCP socket and waits for the ack. ${coord} stores it in SQLite.`,
				lit: [ORIGIN, coord],
				copies: [coord],
				msgs: [
					{ from: ORIGIN, to: coord, kind: 'send' },
					{ from: coord, to: ORIGIN, kind: 'ack' },
				],
			},
			{
				title: `Then the first successor, ${succ1}`,
				caption: `The writes go one replica at a time, in ring order. ${succ1} is next after ${coord}.`,
				lit: [ORIGIN, succ1],
				copies: [coord, succ1],
				msgs: [
					{ from: ORIGIN, to: succ1, kind: 'send' },
					{ from: succ1, to: ORIGIN, kind: 'ack' },
				],
			},
			{
				title: `Then the second successor, ${succ2}: three copies`,
				caption: `${succ2} acks, and the key now has three copies: ${coord}, ${succ1} and ${succ2}. A later write for the same key replaces the older value on each replica.`,
				lit: [ORIGIN, succ2],
				copies: [coord, succ1, succ2],
				msgs: [
					{ from: ORIGIN, to: succ2, kind: 'send' },
					{ from: succ2, to: ORIGIN, kind: 'ack' },
				],
			},
		],
	},
	{
		id: 'b',
		name: 'Scenario B',
		title: `A replica is down during the write, then rejoins`,
		note: 'The buffer is not keyed by destination: whichever node announces itself first receives every buffered write, even ones meant for another node.',
		op: 'put',
		steps: [
			{
				title: `${succ1} is down`,
				caption: `Same put("${KEY}", "${VALUE}") on ${ORIGIN}, same three replicas, but ${succ1} has crashed.`,
				lit: [ORIGIN],
				down: [succ1],
			},
			{
				title: `The coordinator ${coord} acks`,
				caption: `${ORIGIN} writes to ${coord} first, as before, and gets its ack.`,
				lit: [ORIGIN, coord],
				down: [succ1],
				copies: [coord],
				msgs: [
					{ from: ORIGIN, to: coord, kind: 'send' },
					{ from: coord, to: ORIGIN, kind: 'ack' },
				],
			},
			{
				title: `No ack from ${succ1}: buffer the write`,
				caption: `The write to ${succ1} gets no ack. ${ORIGIN} does not give up on it: it adds ${kv} to its buffer of failed writes (failedavd in the code).`,
				lit: [ORIGIN],
				down: [succ1],
				copies: [coord],
				buffer: true,
				msgs: [{ from: ORIGIN, to: succ1, kind: 'fail' }],
			},
			{
				title: `${succ2} acks: two live copies, one buffered`,
				caption: `The last replica, ${succ2}, acks. Two copies are stored; the third waits in ${ORIGIN}'s buffer.`,
				lit: [ORIGIN, succ2],
				down: [succ1],
				copies: [coord, succ2],
				buffer: true,
				msgs: [
					{ from: ORIGIN, to: succ2, kind: 'send' },
					{ from: succ2, to: ORIGIN, kind: 'ack' },
				],
			},
			{
				title: `${succ1} restarts and says "AVD alive"`,
				caption: `When ${succ1} comes back, it sends "AVD alive" to every node on the ring.`,
				lit: [succ1],
				copies: [coord, succ2],
				buffer: true,
				msgs: peers.map((p) => ({ from: succ1, to: p, kind: 'alive' as const })),
			},
			{
				title: `${ORIGIN} returns the buffered write; ${succ1} stores it`,
				caption: `Nodes with an empty buffer reply "empty". ${ORIGIN} sends back everything in its buffer and clears it. ${succ1} inserts ${kv} into its own store: three copies again.`,
				lit: [ORIGIN, succ1],
				copies: [coord, succ1, succ2],
				msgs: [{ from: ORIGIN, to: succ1, kind: 'reply' }],
			},
		],
	},
	{
		id: 'c',
		name: 'Scenario C',
		title: `get(${KEY}) while the coordinator is down`,
		note: 'There is no quorum and no version reconciliation: the answer is whatever that one replica holds.',
		op: 'get',
		steps: [
			{
				title: `get("${KEY}"): the coordinator is ${coord}, and it is down`,
				caption: `get("${KEY}") is called on ${ORIGIN}. The hash points at ${coord}, as in scenario A, but ${coord} has crashed.`,
				lit: [ORIGIN],
				down: [coord],
				copies: [succ1, succ2],
			},
			{
				title: `Ask ${coord}: no answer`,
				caption: `${ORIGIN} sends the read to ${coord}. The request fails.`,
				lit: [ORIGIN],
				down: [coord],
				copies: [succ1, succ2],
				msgs: [{ from: ORIGIN, to: coord, kind: 'fail' }],
			},
			{
				title: `Retry at coordinator + 2: ${succ2}`,
				caption: `On failure the read skips two places along the ring to ${succ2}, the last replica in the chain, and asks it instead.`,
				lit: [ORIGIN, succ2],
				down: [coord],
				copies: [succ1, succ2],
				msgs: [{ from: ORIGIN, to: succ2, kind: 'send' }],
			},
			{
				title: `${succ2} answers "${VALUE}"`,
				caption: `${succ2} returns ${kv}, and that is the result of the read.`,
				lit: [ORIGIN, succ2],
				down: [coord],
				copies: [succ1, succ2],
				msgs: [{ from: succ2, to: ORIGIN, kind: 'reply' }],
			},
		],
	},
];

// Text version of one step's diagram (the SVG's aria-label), so nothing is only in the picture.
const verb = { send: 'sends to', ack: 'acks to', fail: 'gets no answer from', alive: 'says alive to', reply: 'replies to' };
export const describe = (s: Step) =>
	[
		`Ring in hash order: ${ports.join(', ')}.`,
		s.down?.length ? `Down: ${s.down.join(', ')}.` : '',
		s.copies?.length ? `Copies of ${KEY}: ${s.copies.join(', ')}.` : '',
		s.buffer ? `${ORIGIN} holds a buffered write.` : '',
		...(s.msgs ?? []).map((m) => `${m.from} ${verb[m.kind]} ${m.to}.`),
	]
		.filter(Boolean)
		.join(' ');
