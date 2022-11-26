import { createCors } from "itty-cors";
import { IHTTPMethods, Router } from "itty-router";
import { error } from "itty-router-extras";
import { addOutboundLinks, getData, sendWebhooks } from "./lib";

export interface Env {
	webhookLinks: KVNamespace;

	webhookLinksKey: string;
	lastIdsKey: string;

	embedColor: number;

	dashboardLink: string;
}

const router = Router<void, IHTTPMethods>();

// Handle CORS
const { preflight, corsify } = createCors({ origins: ["*"] });
router.all("*", preflight);

router.get("/", (request, env: Env, context) =>
	Response.redirect(
		env.dashboardLink || "https://github.com/kennanhunter/",
		308
	)
);

router.get("/getGames", async (request, env: Env, context) => {
	return Response.json(await getData(env));
});

router.post("/sendWebhooks", (request, env: Env, context) => {
	return sendWebhooks(env);
});

router.post("/addWebhook", async (request, env: Env, context) => {
	if (!request.json) return error(400, "What?");
	const data: { newLink: string } = await request.json().catch((err) => {
		return error(400, "Wrongly formatted JSON");
	});

	if (data.newLink) {
		return addOutboundLinks(env, data.newLink).then(
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

	fetch: (...args: any[]) =>
		router
			// @ts-ignore // typescript :(
			.handle(...args)
			.then((response) => response)
			.catch((err) => error(500, err.stack))
			.then(corsify),
};
