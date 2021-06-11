<script>
	export let answer;
	export let index=0;
</script>

<style>
	button {
			width: 100%;
			background-color: #ff3e00;
			border: 4px solid #ff3e00;
			border-radius: 8px;
			color: white;
			padding: 2px 5px;
			text-align: center;
			text-decoration: none;
			font-size: 2.5em;
			font-family: 'Overpass', sans-serif;
			transition-duration: 0.2s;	
	}
	
	button:hover {
		background-color: #fff;
		color: #000;
	}
	
	.disabled {
  opacity: 0.6;
  cursor: not-allowed;
	}
</style>

{#if index===0}
	<button on:click>
		{answer}
	</button>
{:else}
	<button class="disabled">
		{answer}
	</button>
{/if}