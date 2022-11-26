import { APIEmbed } from "discord-api-types/v10";
import { getGames } from "epic-free-games";
import { Env } from ".";

export const getOutboundLinks = async (env: Env): Promise<string[]> => {
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

export const addOutboundLinks = (env: Env, newLink: string) => {
	return getOutboundLinks(env).then((data) =>
		env.webhookLinks.put(
			env.webhookLinksKey,
			JSON.stringify([...data.filter((val) => val !== newLink), newLink])
		)
	);
};

export const getData = async (env: Env): Promise<APIEmbed[]> => {
	const lastIds = await getLastIds(env);
	return (
		(await getGames("US")).currentGames
			// Filter out games that have already been sent
			.filter((data, index) => {
				console.log(data.id);
				console.log(lastIds);
				if (lastIds.includes(data.id)) {
					return false;
				}

				addLastId(env, data.id);

				return true;
			})
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
			.filter((val) => val !== undefined) as APIEmbed[]
	);
};

export const getLastIds = async (env: Env): Promise<string[]> =>
	JSON.parse((await env.webhookLinks.get(env.lastIdsKey)) || "[]");

export const addLastId = async (env: Env, newId: string): Promise<void> =>
	env.webhookLinks.put(
		env.lastIdsKey,
		JSON.stringify([...new Set([...(await getLastIds(env)), newId])])
	);

export const postToOutboundLinks = async (env: Env) => {
	const outbound = await getOutboundLinks(env);
	const data = await getData(env);

	// If no new games don't send anything
	if (!data.length) return;

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

export const sendWebhooks = async (env: Env) =>
	await postToOutboundLinks(env).then(async () => {
		return new Response(
			`Posting successful to ${(
				await getOutboundLinks(env)
			).length.toLocaleString()} webhooks`
		);
	});
