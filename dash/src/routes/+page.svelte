<script lang="ts">
	import { toast } from "@zerodevx/svelte-toast";

	let newLink: string;
</script>

<div>
	<h1>Epic Games Discord Webhook</h1>
	<p>
		Every time there's a new Epic Games free game deal, you'll be the first
		to hear about it
	</p>

	<form
		on:submit|preventDefault={() => {
			try {
				new URL(newLink);
			} catch {
				toast.push("Invalid URL", {
					theme: {
						"--toastColor": "white",
						"--toastBackground": "red",
						"--toastBarBackground": "darkred",
					},
				});
				throw new Error("Invalid URL");
			}
			fetch("https://free-games-alert.kennan.workers.dev/addWebhook", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ newLink }),
			}).then((response) => {
				if (response.ok) {
					toast.push("Registering Link Successful");
					newLink = "";
				} else toast.push("Something went wrong");
			});
		}}
	>
		<input type="text" name="link" id="link" bind:value={newLink} />
		<br />
		<br />
		<input type="submit" value="Register Webhook Link" />
	</form>

	<h2>I'm lost</h2>
	<p>
		Follow
		<a
			href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
		>
			this discord guide
		</a>
		and take the webhook url (no "/github" at the end) and enter that into the
		text box
	</p>

	<h2>Who are you?</h2>
	<p>
		I'm Kennan Hunter <br />
		Discord: Kennan#4955 <br />
		<a href="https://github.com/KennanHunter/">GitHub</a>
		<a href="https://kennan.tech/">Portfolio</a>
	</p>
</div>

<style>
	form {
		margin: auto;
		text-align: center;
	}
	input {
		height: 3em;
		width: 80%;
	}
	h1 {
		text-align: center;
	}
</style>
