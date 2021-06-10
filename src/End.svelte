<script>
	export let score;
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

<p>
	Your score is {score} out of 5!
</p>
<result>
{#if score==0}
<div><iframe src="https://giphy.com/embed/26mkhPIN0KxjxfPbi" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen title = "How did you do that?"></iframe></div>

{:else if score==1}
<div><iframe src="https://giphy.com/embed/tnstdxAR9iMGh3iBRF" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen title = "Try again"></iframe></div>

{:else if score==2}
<div><iframe src="https://giphy.com/embed/APE5sviIJNPtYJgA8F" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen title = "You can do better"></iframe></div>
	
{:else if score==3}
<div><iframe src="https://giphy.com/embed/1l4TrFpL5G9ZS" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen title = "Not bad"></iframe></div>
	
{:else if score==4}
	<div><iframe src="https://giphy.com/embed/QsU3vYYHB69R3bvBMK" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen title = "Nice job"></iframe></div>
	
{:else}
	<div><iframe src="https://giphy.com/embed/kyRmQ3NQDXrhbqK6Hx" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen title = "Winner"></iframe></div>
{/if}
</result>
