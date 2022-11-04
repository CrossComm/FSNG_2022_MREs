/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

/**
 * The main class of this app. All the logic goes here.
 */
export default class MRETemplate {
	private model: MRE.Actor = null;
	private assets: MRE.AssetContainer;
	private animation: MRE.Animation = null;
	private sampleSound: MRE.Asset;

	constructor(private context: MRE.Context) {
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
		// set up somewhere to store loaded assets (meshes, textures, animations, gltfs, etc.)
		this.assets = new MRE.AssetContainer(this.context);

		// Load a glTF model before we use it
		const modelData = await this.assets.loadGltf('/assets/Centrifuge.gltf', "box");

		// spawn a copy of the glTF model
		this.model = MRE.Actor.CreateFromPrefab(this.context, {
			// using the data we loaded earlier
			firstPrefabFrom: modelData,
			// Also apply the following generic actor properties.
			actor: {
				name: 'Model',
			}
		});

		//assign animations once the model is created
		this.model.created().then(() => this.assignAnimation());	

		this.sampleSound = this.assets.createSound("SampleSound", {
			uri: "/assets/piano2.wav",
		})

		const scaleAnimationData = this.assets.createAnimationData("Scale", {
			tracks: [
				{
					target: MRE.ActorPath("model").transform.local.scale,
					keyframes: this.generateScaleAnimation(1),
					easing: MRE.AnimationEaseCurves.EaseInOutCircular
				}
			]
		})

		const scaleAnimation = await scaleAnimationData.bind(
			{
				model: this.model,	
			},
			{
				isPlaying: false,
				wrapMode: MRE.AnimationWrapMode.PingPong
			}
		);

		// Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
		// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
		const buttonBehavior = this.model.setBehavior(MRE.ButtonBehavior);

		buttonBehavior.onHover('enter', () => {
			if (!this.animation.isPlaying) {
				scaleAnimation.play();
			}
		});

		buttonBehavior.onHover('exit', () => {
			scaleAnimation.stop();
			MRE.Animation.AnimateTo(this.context, this.model, {
				destination: { transform: { local: { scale: { x: 1, y: 1, z: 1 } } } },
				duration: 0.3,
				easing: MRE.AnimationEaseCurves.EaseOutSine
			});
		});

		buttonBehavior.onClick(_ => {
			if (!this.animation.isPlaying) {
				scaleAnimation.stop();
				MRE.Animation.AnimateTo(this.context, this.model, {
					destination: { transform: { local: { scale: { x: 1, y: 1, z: 1 } } } },
					duration: 0.3,
					easing: MRE.AnimationEaseCurves.EaseOutSine
				});

				this.animation.play();

				//add the duration if the sound clip is longer than the animation
				this.model.startSound(this.sampleSound.id, { 
					volume: 1, 
					looping: false, 
					// duration: this.animation.duration 
				});
			}
		});
	}

	//Assigns animation and properties of animation
	private assignAnimation()
	{
		console.log(this.model.targetingAnimations)
		this.animation = this.model.targetingAnimationsByName.get("Centrifuge_Action");
		this.animation.wrapMode = MRE.AnimationWrapMode.Once;
	}

	private generateScaleAnimation(duration: number): Array<MRE.Keyframe<MRE.Vector3>> {
		return [{
			time: 0 * duration,
			value: new MRE.Vector3(1, 1, 1)
		}, {
			time: 0.25 * duration,
			value: new MRE.Vector3(1.1, 1.1, 1.1)
		}, {
			time: 0.5 * duration,
			value: new MRE.Vector3(1.2, 1.2, 1.2)
		}, {
			time: 0.75 * duration,
			value: new MRE.Vector3(1.1, 1.1, 1.1)
		}, {
			time: 1 * duration,
			value: new MRE.Vector3(1, 1, 1)
		}];
	}
}