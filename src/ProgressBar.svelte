<script lang="ts">
  import { Progress } from 'sveltestrap';
	export let currentQuestion;
	export let total;
</script>
<style>
	@import "https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css";
.margin {
		max-width: 90%;
    margin: 1em auto;
		font-family: 'Overpass', sans-serif;
		 text-align: left;
     color: #676778;
		 padding: 0 4em;
		 font-size: 0.8em;
   }
</style>


<div class="margin">
Question {currentQuestion+1} of {total}
<Progress color = "danger" value={currentQuestion+1} max={total} />
</div>