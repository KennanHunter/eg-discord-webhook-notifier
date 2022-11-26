<script lang="ts">
	import { SvelteToast } from "@zerodevx/svelte-toast";
</script>

<div>
	<main>
		<slot />
	</main>
</div>

<SvelteToast />

<style>
	div {
		background-color: #131313;
		display: grid;
		min-height: 100vh;
		grid-template-columns: auto auto auto;
		justify-content: center;
	}
	main {
		background-color: #ffffff;
		padding: 2em;
		margin: 1em;
		max-width: 40em;
		grid-column-start: 2;
	}
</style>
