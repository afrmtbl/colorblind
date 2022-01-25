// This code is realllyyyy not great but it works for now...

let GUESS_DURATION = 7000;
const COLORS = [
	"green", "orange", "red", "blue", "skyblue",
	"yellow", "pink", "purple", "navy", "crimson"
];

let score = 0;
let brightnessDifference = 20;
let lastColor = null;

const circlesEl = document.getElementById("circles");
const scoreEl = document.getElementById("score");
const scoresEl = document.getElementById("scores");

const lastScoreEl = document.getElementById("last-score");
const highScoreEl = document.getElementById("high-score");

const lastScore = localStorage.getItem("last_score") || "0";
const highScore = localStorage.getItem("high_score") || "0";

highScoreEl.textContent = "Your Highest: " + highScore;
lastScoreEl.textContent = "Your Last: " + lastScore;

const shouldBounceElements = document.getElementsByClassName("should-bounce");

const audioContext = new window.AudioContext();
let correctBuf = null;
let failBuff = null;

(async () => {
	let data = await fetch("correct.mp3").then(res => res.arrayBuffer());
	correctBuf = await audioContext.decodeAudioData(data);

	data = await fetch("fail.mp3").then(res => res.arrayBuffer());
	failBuf = await audioContext.decodeAudioData(data);
})();

function playBounceAnimation() {
	for (const el of shouldBounceElements) {
		el.classList.remove("bounce-anim");
		void el.offsetWidth
		el.classList.add("bounce-anim");
	}
}

function getRandomNum(max, lastNum = null) {
	let num = Math.floor(Math.random() * max);
	while (num === lastNum) {
		num = Math.floor(Math.random() * max);
	}

	return num;
}

let timeStarted = performance.now();
function updateTimer() {
	const currentMillis = performance.now();

	const percent = (currentMillis - timeStarted) / GUESS_DURATION * 100;
	scoreEl.style.setProperty("--timer-percent", `${100 - percent}%`);

	// console.log(timeStarted, currentMillis, 100 - percent);
	if (currentMillis - timeStarted < GUESS_DURATION) {
		requestAnimationFrame(updateTimer);
	}
	else {
		const event = new Event("game_lost");
		document.dispatchEvent(event);
	}
}


function changeCircleColors() {
	const randomColorIndex = getRandomNum(COLORS.length, lastColor);
	lastColor = randomColorIndex;
	const randomColor = COLORS[randomColorIndex];
	circles.style.setProperty("--circle-color", randomColor);
}

function changeOneCircle() {
	const randomCircle = getRandomNum(circles.children.length);
	const randomCircleEl = circles.children[randomCircle];
	randomCircleEl.classList.add("answer");

	let brightness
	if (Math.random() > 0.5) {
		brightness = 100 + brightnessDifference;
	}
	else {
		brightness = 100 - brightnessDifference
	}

	randomCircleEl.style.filter = `brightness(${brightness}%)`;
}

changeCircleColors();
changeOneCircle();

function addCircles(amount) {
	for (let i = 0; i < amount; i++) {
		const circle = document.createElement("div");
		circle.classList.add("circle", "should-bounce", "bounce-anim");
		circles.append(circle);
	}
}

document.addEventListener("game_lost", e => {
	const audioSource = audioContext.createBufferSource();
	audioSource.buffer = failBuf;
	audioSource.connect(audioContext.destination);
	audioSource.start(0);
	scoreEl.style.display = "none";
	scoresEl.style.display = "block";

	const answerEl = document.querySelector(".answer");
	answerEl.filter = "";
	answerEl.classList.remove("answer");

	while (circles.lastChild) {
		circles.lastChild.remove();
	}

	circles.classList.remove("level2");
	addCircles(4);

	changeCircleColors();
	changeOneCircle();
	playBounceAnimation();

	localStorage.setItem("last_score", score);
	console.log("the score is", score, parseInt(highScore, 10));
	if (score > parseInt(highScore, 10)) {
		localStorage.setItem("high_score", score);
	}

	highScoreEl.textContent = "Your Highest: " + localStorage.getItem("high_score");
	lastScoreEl.textContent = "Your Last: " + localStorage.getItem("last_score");

	score = 0;
});

function circleClick(e) {
	const target = e.target;
	if (!target.classList.contains("circle")) return;

	if (target.classList.contains("answer")) {
		target.classList.remove("answer");
		target.style.filter = "";

		score += 1;
		scoreEl.textContent = score;

		const audioSource = audioContext.createBufferSource();
		audioSource.buffer = correctBuf;
		audioSource.connect(audioContext.destination);
		audioSource.start(0);

		if (score === 1) {
			scoresEl.style.display = "none";
			scoreEl.style.display = "block";

			requestAnimationFrame(updateTimer);
		}
		else if (score === 5) {
			while (circles.lastChild) {
				circles.lastChild.remove();
			}

			circles.classList.add("level2");
			addCircles(9);
		}
		else if (score === 15) {
			brightnessDifference -= 5;
			GUESS_DURATION = 5000;
		}
		else if (score === 30) {
			brightnessDifference -= 5;
			GUESS_DURATION = 3000;
		}

		timeStarted = performance.now();

		changeCircleColors();
		changeOneCircle();
		playBounceAnimation();
	}
	else {
		timeStarted -= 500;
	}
}

circles.addEventListener("click", circleClick);

