<script>
	import Question from './Question.svelte';
	
	import ProgressBar from './ProgressBar.svelte';
	import Option from './Option.svelte';
	import Result from './Result.svelte';
	import End from './End.svelte';
	
	let score = 0;
  let currentQuestion = 0;
	$: currentOptions = currentQuestion;
	let showresult= false;
	let total = 5;
	let correct = false;
	
	let questions = [
		{
			"question": "Which statement describes Svelte best?",
			"options": [
				"Svelte is a JavaScript library for fast routing.",
				"Svelte is a template for building nice quiz apps.",
				"Svelte is an extension for frameworks like React, Vue and Angular.",
				"Svelte is a component framework that works like a compiler producing vanilla JavaScript."
			],
			"correctIndex": 3
		},
		{
			"question": "What is valid Svelte syntax?",
			"options": [
				"Svelte.component ({props: ['text']})",
				"function Component1 (props) { ... return (<h1> props.text; </h1>)}",
				"Component1 = new Component (props);",
				"<script> export let props ..."
			],
			"correctIndex": 3
		},
		{
			"question": "What do reactive declarations in Svelte look like?",
			"options": [
				"reactive sum = summand1 + summand2;",
				"$: sum = summand1 + summand2;",
				"new Reactive({name: sum; data: summand1 + summand2;})",
				"sum <= summand1 + summand2;"
			],
			"correctIndex": 1
		},
		{
			"question": "Which statement is NOT correct?",
			"options": [
				"Svelte is component-oriented.",
				"Svelte produces a bundle.css file with good readability.",
				"Svelte adds extra library code to your source code.",
				"Svelte can be used to produce single web components that can be reused in other web applications."
			],
			"correctIndex": 1
		},
		{
			"question": "How did you like this quiz?",
			"options": [
				"Absolutely the best quiz about Svelte ever!",
				"Could be better.",
				"Better practice your UI skills and try again.",
				"Nice! But these gifs..."
			],
			"correctIndex": 0
		}
	];
	
	function checkAnswer(answer, que) {   
		if(answer === que.options[que.correctIndex]) {
			score +=1;
			correct=true;
		}
		showresult = true;
	}
	
	function next() {
		showresult = false;
		correct=false;
		currentQuestion+=1;
	}
	
	function restartQuiz() {
		showresult = false
		currentQuestion=0;
		score = 0;
	}
	
</script>

<style>
  h1 {
		font-family: 'Overpass', sans-serif;
		letter-spacing: 2px;
    color: #ff3e00;
		text-align: center;
    text-transform: uppercase;
		text-shadow: 2px 1px 5px grey;
    font-size: 4vw;
    margin-top: 8px;
    }
	
	.options {
		max-width: 70%;
    display: grid;
    margin: 2em auto;
		font-size: 1vw;
    }
	
	button {
		width: auto;
		background-color: #ff3e00;
		border: 4px solid #ff3e00;
		border-radius: 8px;
		color: white;
		padding: 1px 5px;
		text-align: center;
		text-decoration: none;
		font-size: 2vw;
		font-family: 'Overpass', sans-serif;
		transition-duration: 0.2s;
		margin-top: 8px;
		margin-right: 25%;
		float: right;
	}
	
	button:hover {
		background-color: #fff;
		color: #000;
	}
</style>


<h1>  Svelte Quiz </h1> 
<!-- {#if ...} {:else if ...} {:else} {/if} is Svelte syntax for conditional rendering -->
{#if (currentQuestion  < total) }													 
		{#if !showresult }				 
			
			<ProgressBar {currentQuestion}{total}/> 
			<!-- components are imported like an html tag (but capitalized) -->	
			<Question questionText={questions[currentQuestion].question}/>
			<div class=options>
				{#if (currentQuestion  < total-1) }	
				<!-- {#each} {/each} is Svelte syntax for iteration -->
				{#each questions[currentOptions].options as answer}
					<!-- the "on:" directive is used to listen to DOM events -->
					<Option on:click={() => checkAnswer(answer, questions[currentOptions])} {answer}></Option>
				&nbsp;
				{/each}
				{:else}
				{#each questions[currentOptions].options as answer, index}
					<Option on:click={() => checkAnswer(answer, questions[currentOptions])} {answer} {index} ></Option>
				&nbsp;
				{/each}
				{/if}
			</div>
		{:else}
			<!-- <Result {correct}/>	is a shorthand for <Result correct={correct}/>	 -->
			<Result {correct} correctAnswer= {questions[currentOptions].options[questions[currentOptions].correctIndex]}/>	
			{#if (currentQuestion  < total-1) }
				<!-- the "on:" directive is used to listen to DOM events -->								
				<button on:click={() => next()}>Next Question</button>
			{:else}
				<button on:click={() => next()}>Finish</button>
			{/if}
		{/if}	
{:else}
	<!-- <End {score}/>	is a shorthand for <End score={score}/>	 -->
	<End {score}/>	
	<button on:click={() => restartQuiz()}>Restart Quiz</button>
{/if}	




														




