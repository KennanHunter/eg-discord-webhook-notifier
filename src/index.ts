import { Hono } from "hono";
import { cors } from "hono/cors";
import { addOutboundLinks, getData, sendWebhooks } from "./lib";

export interface Env {
	webhookLinks: KVNamespace;

	webhookLinksKey: string;

	lastIdsKey: string;

	embedColor: number;

	dashboardLink: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
	"/*",
	cors({
		origin: "*",
	})
);

app.get("/", (c) =>
	c.redirect(c.env.dashboardLink || "https://github.com/kennanhunter/", 308)
);

app.get("/getGames", async (c) => {
	return c.json(await getData(c.env));
});

app.post("/sendWebhooks", (c) => {
	return sendWebhooks(c.env);
});

app.post("/addWebhook", async (c) => {
	if (!c.req.json) return c.newResponse("What?", 400);

	const data: { newLink: string } = (await c.req.json().catch(() => {
		return c.newResponse("Wrongly formatted JSON", 400);
	})) as any;

	if (data.newLink) {
		return addOutboundLinks(c.env, data.newLink).then(
			() => new Response("Successful")
		);
	}
});

export default {
	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext
	): Promise<void> {
		sendWebhooks(env);
	},

	fetch: app.fetch,
};
