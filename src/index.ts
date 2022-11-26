import { getGames } from "epic-free-games";

export interface Env {
	webhookLinks: KVNamespace;
}

const getData = async () => await getGames("US");

export default {
	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext
	): Promise<void> {
		const games = await getGames("US");
		console.log(games);
	},
	async fetch(): Promise<Response> {
		return Response.json(await getData());
	},
};
