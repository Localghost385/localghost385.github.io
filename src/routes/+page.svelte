<script lang="ts">
	import { onMount } from 'svelte';
	import type { beforeAll } from 'vitest';

	// define a grid of cells and a grid of points, each cell is a group of 4 points in a square, cells overlap
	class point {
		x: number;
		y: number;

		value: number = 0;
		constructor(x: number, y: number) {
			this.x = x;
			this.y = y;
		}
		updateValue(metaballs: metaball[]) {
			this.value = metaballs.reduce((acc, mb) => acc + mb.calculateInfluence(this.x, this.y), 0);
		}
	}
	class cell {
		points: point[];
		constructor(points: point[]) {
			this.points = points;
		}
	}

	class grid {
		points: point[][];
		cells: cell[][];

		constructor(width: number, height: number, cellSize: number) {
			this.points = [];
			this.cells = [];

			// Initialize points
			for (let x = 0; x < width; x += cellSize) {
				this.points[x] = [];
				for (let y = 0; y < height; y += cellSize) {
					this.points[x][y] = new point(x, y);
				}
			}

			// Initialize cells
			for (let x = 0; x < width - cellSize; x += cellSize) {
				this.cells[x] = [];
				for (let y = 0; y < height - cellSize; y += cellSize) {
					this.cells[x][y] = new cell([
						this.points[x][y],
						this.points[x + cellSize][y],
						this.points[x + cellSize][y + cellSize],
						this.points[x][y + cellSize]
					]);
				}
			}
		}
		draw() {
			this.points.forEach((row) => {
				row.forEach((point) => {
					ctx.beginPath();
					//draw a cross at the point
					ctx.moveTo(point.x - cellSize / 4, point.y);
					ctx.lineTo(point.x + cellSize / 4, point.y);
					ctx.moveTo(point.x, point.y - cellSize / 4);
					ctx.lineTo(point.x, point.y + cellSize / 4);

					ctx.stroke();
				});
			});
		}
	}
	class metaball {
		calculateInfluence(x: number, y: number) {
			return Math.pow(this.radius, 2) / (Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2) + 1);
		}
		x: number;
		y: number;
		dx: number;
		dy: number;
		radius: number;
		value: number;
		constructor(x: number, y: number, radius: number, value: number, dx: number, dy: number) {
			this.x = x;
			this.y = y;
			this.radius = radius;
			this.value = value;
			this.dx = dx;
			this.dy = dy;
		}
		update() {
			this.x += this.dx;
			this.y += this.dy;

			// Ensure metaball stays within the bounds of the canvas
			if (this.x - this.radius < 0 || this.x + this.radius > width) {
				this.dx = -this.dx;
			}
			if (this.y - this.radius < 0 || this.y + this.radius > height) {
				this.dy = -this.dy;
			}
		}
	}

	function createMetaballs(
		count: number,
		maxWidth: number,
		maxHeight: number,
		maxRadius: number,
		maxValue: number
	) {
		const newMetaballs = [];
		for (let i = 0; i < count; i++) {
			const x = Math.random() * maxWidth;
			const y = Math.random() * maxHeight;
			const radius = Math.random() * maxRadius;
			const value = Math.random() * maxValue;
			const dx = Math.random() * 5 - 1;
			const dy = Math.random() * 5 - 1;
			newMetaballs.push(new metaball(x, y, radius, value, dx, dy));
		}
		return newMetaballs;
	}

	let canvas: HTMLCanvasElement;
	let ctx: any;
	//set width and height to the viewport width and height
	let width = 1600;
	let height = 900;

	let cellSize = 8;

	function marchingSquares(cells: any[], threshold: number) {
		cells.forEach((cellRow: any[]) => {
			cellRow.forEach((cell: { points: any[] }) => {
				let index = 0;
				if (cell.points[0].value < threshold) index |= 1;
				if (cell.points[1].value < threshold) index |= 2;
				if (cell.points[2].value < threshold) index |= 4;
				if (cell.points[3].value < threshold) index |= 8;

				ctx.beginPath();
				if (index === 1 || index === 14) {
					ctx.moveTo(cell.points[0].x + cellSize / 2, cell.points[0].y); //correct
					ctx.lineTo(cell.points[0].x, cell.points[0].y + cellSize / 2);
				} else if (index === 2 || index === 13) {
					ctx.moveTo(cell.points[1].x, cell.points[1].y + cellSize / 2); //correct
					ctx.lineTo(cell.points[1].x - cellSize / 2, cell.points[1].y);
				} else if (index === 3 || index === 12) {
					ctx.moveTo(cell.points[0].x, cell.points[0].y + cellSize / 2); //correct
					ctx.lineTo(cell.points[1].x, cell.points[1].y + cellSize / 2);
				} else if (index === 4 || index === 11) {
					ctx.moveTo(cell.points[2].x, cell.points[2].y - cellSize / 2); //correct
					ctx.lineTo(cell.points[2].x - cellSize / 2, cell.points[2].y);
				} else if (index === 6 || index === 9) {
					ctx.moveTo(cell.points[0].x + cellSize / 2, cell.points[0].y); //correct
					ctx.lineTo(cell.points[3].x + cellSize / 2, cell.points[3].y);
				} else if (index === 7 || index === 8) {
					ctx.moveTo(cell.points[3].x, cell.points[3].y - cellSize / 2); //correct
					ctx.lineTo(cell.points[3].x + cellSize / 2, cell.points[3].y);
				} else if (index === 5) {
				}
				ctx.strokeStyle = '#b4befe';
				ctx.lineWidth = 2;
				ctx.stroke();
			});
		});
	}

	let slider = 0.5;

	onMount(() => {
		// set up ctx
		ctx = canvas.getContext('2d');
		let canvas_grid = new grid(width, height, cellSize);
		let metaballs: metaball[] = createMetaballs(15, width, height, 80, 10);
		// Store the previous state of metaballs
		let prevMarchingSquaresState: string | null = null;

		function animate() {
			let marchingSquaresChanged = false;

			// Update and draw metaballs
			metaballs.forEach((ball) => {
				ball.update();
			});

			// Update grid points' values and draw red squares if value is above threshold
			canvas_grid.points.forEach((row) => {
				row.forEach((point) => {
					point.updateValue(metaballs);
				});
			});

			// Check if the marching squares lines have changed
			const currentMarchingSquaresState = JSON.stringify(canvas_grid.cells);
			if (currentMarchingSquaresState !== prevMarchingSquaresState) {
				prevMarchingSquaresState = currentMarchingSquaresState;
				marchingSquaresChanged = true;
			}

			// Clear the canvas if either the metaballs or marching squares lines have changed
			if (marchingSquaresChanged) {
				ctx.clearRect(0, 0, width, height); // Clear the canvas
			}

			// Draw marching squares lines if they have changed
			if (marchingSquaresChanged) {
				marchingSquares(canvas_grid.cells, slider);
			}

			requestAnimationFrame(animate);
		}

		// Start the animation loop
		requestAnimationFrame(animate);
	});
</script>

<canvas id="canvas" bind:this={canvas} {width} {height}> </canvas>
<input type="range" min="-0.1" max="3.0" step="0.1" value={slider} />

<style>
	@import '/src/styles/global.scss';
</style>
