import * as vscode from "vscode";

const SECRET_KEY = "cheats.apiKey";

export interface SearchResult {
	id: string;
	title: string;
	type: string;
	snippet: string;
	private: boolean;
	stars: number;
	points: number;
}

interface SearchResponse {
	results: SearchResult[];
}

interface GetCheatResponse {
	id: string;
	title: string;
	type: string;
	body: { text: string };
}

// Field limits enforced server-side by POST /mcp/addCheat; validated client-side too
// so the user finds out before the request round-trips, not after silent truncation.
export const TITLE_MAX_LENGTH = 40;
export const TYPE_MAX_LENGTH = 15;
export const BODY_MAX_LINES = 100;
export const BODY_MAX_LINE_LENGTH = 600;
export const MAX_RECORD_SIZE_BYTES = 10 * 1024;

export interface NewCheat {
	title: string;
	typeName: string;
	body: { text: string };
	private: boolean;
}

// POST /mcp/addCheat, /mcp/addTask, /mcp/addBrain and /mcp/addProjectTask all answer with just the new record's id.
interface AddResponse {
	id: string;
}

export interface TaskResult {
	id: string;
	title: string;
	category: string;
	text: string;
	highlights: string[];
	links: string[];
	createdDateMs: number;
	expiresAtMs: number | null;
}

interface SearchTasksResponse {
	tasks: TaskResult[];
	totalPages: number;
}

interface GuidesResponse {
	guides: string;
}

// Tasks and Brain are two separate sections of the site, each with its own Firestore collection
// (`tasks` and `brain`) and its own REST endpoints (SECTION_ENDPOINTS below): /tasks holds the
// user's own notes and checklists, /brain holds the AI-facing entries
// (`brief` and `rules` are the user's standing guidance, `memory` is what an assistant records for
// itself). Mirrors TASK_SECTIONS in the site's functions/routes/db/tasks.js. Category is a closed
// enum server-side, so it's a cycling pill in the create forms rather than a text field, an
// unrecognised value is a 400, not a new freeform label the way a cheat's typeName is.
export type TaskSection = "tasks" | "brain";
export type TaskCategory = "note" | "list" | "brief" | "rules" | "memory";

export const SECTION_CATEGORIES: Record<TaskSection, readonly TaskCategory[]> = {
	tasks: ["note", "list"],
	brain: ["brief", "rules", "memory"]
};

export type TaskDuration = "permanent" | "1h" | "1d" | "1w";

export interface NewTask {
	title: string;
	category: TaskCategory;
	text: string;
	duration: TaskDuration;
}

// Projects are the boards, cards are what sit on them. Unlike every other section a board can be
// shared with the user, so /mcp/searchProjects returns those too, with a `role` saying what the
// user may do on it. A viewer can read the cards but not add any.
export type ProjectRole = "owner" | "editor" | "viewer";

export interface ProjectResult {
	id: string;
	name: string;
	createdDateMs: number;
	role: ProjectRole;
	ownerEmail: string;
	memberCount: number;
}

interface SearchProjectsResponse {
	projects: ProjectResult[];
}

// A card's status is the board column it sits in, and a closed enum server-side
// (PROJECT_TASK_STATUSES in the site's functions/routes/db/projects.js). There is no done column:
// a finished card is deleted.
export const PROJECT_CARD_STATUSES = ["open", "in-progress", "in-review"] as const;
export type ProjectCardStatus = typeof PROJECT_CARD_STATUSES[number];

export const PROJECT_CARD_STATUS_LABELS: Record<ProjectCardStatus, string> = {
	open: "Open",
	"in-progress": "In progress",
	"in-review": "In review"
};

export interface ProjectCardResult {
	id: string;
	title: string;
	projectID: string;
	status: ProjectCardStatus;
	text: string;
	highlights: string[];
	links: string[];
	createdDateMs: number;
}

interface SearchProjectCardsResponse {
	tasks: ProjectCardResult[];
}

export interface NewProjectCard {
	title: string;
	projectID: string;
	text: string;
	status: ProjectCardStatus;
}

export class ApiError extends Error {
	/** Set by the server alongside a 403 for a Pro-only feature (requireProTier in the site's dbHelpers.js). */
	public tier?: string;

	constructor(public status: number, message: string, tier?: string) {
		super(message);
		this.tier = tier;
	}

	/** The account is on Free and the endpoint (any write) needs Pro. */
	get needsPro(): boolean {
		return this.status === 403 && this.tier === "free";
	}

	/** The key is limited to particular sections of the app, and this endpoint is outside them. */
	get outsideKeySections(): boolean {
		return this.status === 403 && /not scoped to/i.test(this.message);
	}
}

export async function getApiKey(secrets: vscode.SecretStorage): Promise<string | undefined> {
	return secrets.get(SECRET_KEY);
}

export async function setApiKey(secrets: vscode.SecretStorage): Promise<void> {
	const key = await vscode.window.showInputBox({
		title: "Cheatsheet Sidekick: Set API Key",
		prompt: "Paste an API key from cheats.aarontrotter.com/user. A free account covers a read-scoped " +
			"key for search; creating cheats needs a read + write key, which requires Pro (cheats.aarontrotter.com/billing).",
		password: true,
		ignoreFocusOut: true
	});
	if (key) {
		await secrets.store(SECRET_KEY, key.trim());
		vscode.window.showInformationMessage("Cheatsheet Sidekick: API key saved.");
	}
}

function baseUrl(): string {
	return vscode.workspace.getConfiguration("cheats").get<string>("baseUrl", "").replace(/\/+$/, "");
}

/** A page on the configured Cheatsheet site, e.g. sitePage("/billing"), for the commands that link out to it. */
export function sitePage(path: string): vscode.Uri {
	return vscode.Uri.parse(`${baseUrl()}${path}`);
}

async function request<T>(path: string, secrets: vscode.SecretStorage, signal: AbortSignal, init?: RequestInit): Promise<T> {
	const apiKey = await getApiKey(secrets);
	if (!apiKey) {
		throw new ApiError(401, "No API key set. Run 'Cheatsheet Sidekick: Set API Key' first.");
	}
	const res = await fetch(`${baseUrl()}${path}`, {
		...init,
		// X-Cheatsheet-Client is purely informational, read server-side for the /user page's
		// per-client usage breakdown (see functions/dbHelpers.js's getClientId in the main repo).
		// Safe against an older server that doesn't recognize it.
		headers: { Authorization: `Bearer ${apiKey}`, "X-Cheatsheet-Client": "vscode-extension", ...(init?.headers ?? {}) },
		signal
	});
	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as { error?: string; tier?: string };
		throw new ApiError(res.status, body.error || res.statusText, body.tier);
	}
	return res.json() as Promise<T>;
}

// Shared by every create call: same method, same content type, same { id } response, so only the
// path and payload differ.
async function post(path: string, payload: unknown, secrets: vscode.SecretStorage, signal: AbortSignal): Promise<string> {
	const data = await request<AddResponse>(path, secrets, signal, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});
	return data.id;
}

// For the searches where a blank query means "everything, newest first" rather than an error.
function withOptionalQuery(path: string, query: string): string {
	return query ? `${path}?${new URLSearchParams({ q: query })}` : path;
}

export async function searchCheats(
	query: string,
	secrets: vscode.SecretStorage,
	signal: AbortSignal
): Promise<SearchResult[]> {
	const limit = vscode.workspace.getConfiguration("cheats").get<number>("limit", 10);
	const params = new URLSearchParams({ q: query, limit: String(limit) });
	const data = await request<SearchResponse>(`/mcp/search?${params}`, secrets, signal);
	return data.results;
}

export async function getCheatBody(
	id: string,
	secrets: vscode.SecretStorage,
	signal: AbortSignal
): Promise<string> {
	const params = new URLSearchParams({ id });
	const data = await request<GetCheatResponse>(`/mcp/getCheat?${params}`, secrets, signal);
	return data.body.text;
}

export async function addCheat(
	cheat: NewCheat,
	secrets: vscode.SecretStorage,
	signal: AbortSignal
): Promise<string> {
	return post("/mcp/addCheat", cheat, secrets, signal);
}

// Tasks and Brain each have their own pair of endpoints server-side, and neither can reach the
// other's entries: /mcp/searchTasks and /mcp/addTask only accept `note`/`list` (a Brain category is
// a 400), while /mcp/searchBrain and /mcp/addBrain only accept `brief`/`rules`/`memory`. So the
// section picks the path, not a query parameter.
const SECTION_ENDPOINTS: Record<TaskSection, { search: string; add: string }> = {
	tasks: { search: "/mcp/searchTasks", add: "/mcp/addTask" },
	brain: { search: "/mcp/searchBrain", add: "/mcp/addBrain" }
};

export async function searchTasks(
	query: string,
	section: TaskSection,
	secrets: vscode.SecretStorage,
	signal: AbortSignal
): Promise<TaskResult[]> {
	const data = await request<SearchTasksResponse>(withOptionalQuery(SECTION_ENDPOINTS[section].search, query), secrets, signal);
	return data.tasks;
}

export async function addTask(
	task: NewTask,
	section: TaskSection,
	secrets: vscode.SecretStorage,
	signal: AbortSignal
): Promise<string> {
	return post(SECTION_ENDPOINTS[section].add, task, secrets, signal);
}

// The user's own standing guidance (their Brain's `brief` and `rules` entries, `memory` excluded)
// pre-formatted server-side as markdown. This is the same text the site hands an MCP client on connect.
// Returns "" when they have no such entries yet.
export async function getGuides(secrets: vscode.SecretStorage, signal: AbortSignal): Promise<string> {
	const data = await request<GuidesResponse>("/mcp/getGuides", secrets, signal);
	return data.guides;
}

// The boards the user can see, their own and any shared with them, name-sorted by the server.
export async function searchProjects(secrets: vscode.SecretStorage, signal: AbortSignal): Promise<ProjectResult[]> {
	const data = await request<SearchProjectsResponse>("/mcp/searchProjects", secrets, signal);
	return data.projects;
}

// Every card on every board the user can see, shared ones included. Unpaginated server-side: a
// board is read whole.
export async function searchProjectCards(
	query: string,
	secrets: vscode.SecretStorage,
	signal: AbortSignal
): Promise<ProjectCardResult[]> {
	const data = await request<SearchProjectCardsResponse>(withOptionalQuery("/mcp/searchProjectTasks", query), secrets, signal);
	return data.tasks;
}

export async function addProjectCard(
	card: NewProjectCard,
	secrets: vscode.SecretStorage,
	signal: AbortSignal
): Promise<string> {
	return post("/mcp/addProjectTask", card, secrets, signal);
}
