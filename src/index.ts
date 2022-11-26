import { APIEmbed } from "discord-api-types/v10";
import { getGames } from "epic-free-games";

export interface Env {
	webhookLinks: KVNamespace;

	webhookLinksKey: string;
	lastIdsKey: string;

	embedColor: number;

	dashboardLink: string;
}

const getOutboundLinks = async (env: Env): Promise<string[]> => {
	const data = JSON.parse(
		(await env.webhookLinks.get(env.webhookLinksKey).catch((err) => {
			console.error("Something went wrong when accessing KV");
			throw err;
		})) || ""
	);

	if (!Array.isArray(data))
		throw new Error("Outbound links are not an array");
	return data;
};

const addOutboundLinks = (env: Env, newLink: string) => {
	getOutboundLinks(env).then((data) =>
		env.webhookLinks.put(
			env.webhookLinksKey,
			JSON.stringify([...data, newLink])
		)
	);
};

const getData = async (env: Env): Promise<APIEmbed[]> => {
	return (await getGames("US")).currentGames
		.map((data, index): APIEmbed | undefined => {
			// Discord disallows sending more than 10 embeds
			if (index >= 10) return undefined;

			return {
				title: data.title,
				description: data.description,
				timestamp: data.effectiveDate,
				image: {
					url: data.keyImages[0].url,
				},
				color: env.embedColor,
			} as APIEmbed;
		})
		.filter((val) => val !== undefined) as APIEmbed[];
};

const getLastIds = async (env: Env) =>
	JSON.parse((await env.webhookLinks.get(env.lastIdsKey)) || "[]");

const postToOutboundLinks = async (env: Env) => {
	const outbound = await getOutboundLinks(env);
	const data = await getData(env);
	const body = JSON.stringify({
		content: "New Free Epic Games Deals!!!",
		username: "Free Games Alert",
		embeds: data,
	});

	outbound.map((link) =>
		fetch(link, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: body,
		}).then((response) => console.log(response.statusText))
	);
};

const sendWebhooks = async (env: Env) =>
	await postToOutboundLinks(env).then(
		async () =>
			new Response(
				`Posting successful to ${
					(
						await env.webhookLinks.list()
					).keys.length
				} webhooks`
			)
	);

export default {
	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext
	): Promise<void> {
		sendWebhooks(env);
	},

	async fetch(request: Request, env: Env): Promise<Response> {
		const { url, method } = request;
		const { pathname } = new URL(url);

		if (method === "GET") {
			if (pathname === "/getGames")
				return Response.json(await getData(env));
		}

		if (method === "POST") {
			if (pathname === "/sendWebhooks") {
				return sendWebhooks(env);
			}

			request.json().then((data) => {
				if (!data) throw new Error("Fuckkkk");
				if (pathname === "/addWebhook") {
					if ((data as { newLink: string }).newLink) {
						addOutboundLinks(
							env,
							(data as { newLink: string }).newLink
						);
					}
				}
			});
		}

		return Response.redirect(
			env.dashboardLink || "https://github.com/kennanhunter/"
		);
	},
};
