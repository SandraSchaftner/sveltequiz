<script>
	export let correct;
	export let correctAnswer;
</script>

<style>
	div {
		display: block;
  	margin-left: auto;
  	margin-right: auto;
		max-width:50%;
		height:0;
		padding-bottom:30%;
		position:relative;
	}
	p {
		 font-family: 'Overpass', sans-serif;
		 text-align: center;
     color: #000;
		 padding: 0 4em;
		 font-size: 2vw;
  } 
</style>

{#if !correct}
<div><iframe src="https://giphy.com/embed/l4pLY0zySvluEvr0c" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen title = "You are wrong"></iframe></div>
<p>
	The correct answer is: {correctAnswer}
</p>
{:else}
<div><iframe src="https://giphy.com/embed/l0MYy7QpDDVGVfAAw" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen title = "You are right"></iframe></div>
{/if}
