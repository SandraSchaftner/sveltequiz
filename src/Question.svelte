<script>
   	// the keyword "export" is used to pass props to children 
	export let questionText;
</script>

<style> 
	/* h1 styling is scoped to Question component. There is no conflict with h1 in App component. */
   h1 {
	font-family: 'Overpass', sans-serif;
	text-align: center;
     	color: #000;
	padding: 1em 1em;
	font-size: 1.2em;
   }    
</style>

<h1>{questionText}</h1>
