class ARHelper {
    // libs objects
    threeLibInstance = null;
    threeXLibInstance = null;
    //
    scene = null;
    camera = null;
    renderer = null;
    clock = null;
    // frame time 
    deltaTime = 0;
    totalTime = 0;
    // arToolkit
    arToolkitSource = null;
    arToolkitContext = null;

    constructor(threeLibInstance, threeXLibInstance) {
        this.threeLibInstance = threeLibInstance;
        this.threeXLibInstance = threeXLibInstance;

        this.initialize.bind(this);
        this.onResize.bind(this);
        this.animate.bind(this);
        this.render.bind(this);
    }

    initialize() {
        this.scene = new this.threeLibInstance.Scene();
        const ambientLight = new this.threeLibInstance.AmbientLight(0xcccccc, 0.5);
        this.scene.add(ambientLight);

        this.camera = new this.threeLibInstance.Camera();
        this.scene.add(this.camera);

        this.renderer = new this.threeLibInstance.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setClearColor(new this.threeLibInstance.Color('lightgrey'), 0)
        this.renderer.setSize(640, 480);
        this.renderer.domElement.style.position = 'absolute'
        this.renderer.domElement.style.top = '0px'
        this.renderer.domElement.style.left = '0px'
        document.body.appendChild(this.renderer.domElement);

        this.clock = new this.threeLibInstance.Clock();

        this.arToolkitSource = new this.threeXLibInstance.ArToolkitSource({
            sourceType: 'webcam',
        });

        this.arToolkitContext = new this.threeXLibInstance.ArToolkitContext({
            cameraParametersUrl: './data/camera_para.dat',
            detectionMode: 'mono'
        });

        this.arToolkitContext.init(() => {
            this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());
        });

        this.arToolkitSource.init(() => this.onResize());
        window.addEventListener('resize', this.onResize.bind(this));
    }

    onResize() {
        this.arToolkitSource.onResizeElement();
        this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);

        if (this.arToolkitContext.arController !== null) {
            this.arToolkitSource.copyElementSizeTo(this.arToolkitContext.arController.canvas);
        }
    }

    update(cb) {
        if (cb?.hasOwnProperty('before')) {
            cb.before();
        }

        if (this.arToolkitSource.ready !== false) {
            this.arToolkitContext.update(this.arToolkitSource.domElement);
        }

        if (cb?.hasOwnProperty('after')) {
            cb.after();
        }
    }


    render() {
        this.renderer.render(this.scene, this.camera);
    }

    animate(cb) {
        return () => {
            window.requestAnimationFrame(this.animate(cb));
            this.deltaTime = this.clock.getDelta();
            this.totalTime += this.deltaTime;
            this.update(cb);
            this.render();
        }
    }
}

class ARHelperPortal extends ARHelper {
    render() {
        let gl = this.renderer.context;
        this.renderer.clear(true, true, true);
        this.renderer.autoClear = false;

        gl.enable(gl.STENCIL_TEST);

        this.camera.layers.set(1);

        gl.stencilFunc(gl.ALWAYS, 1, 0xff);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.stencilMask(0xff);

        gl.colorMask(false, false, false, false);
        gl.depthMask(false);

        this.renderer.render(this.scene, this.camera);

        gl.colorMask(true, true, true, true);
        gl.depthMask(true);

        gl.stencilFunc(gl.EQUAL, 1, 0xff);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

        this.camera.layers.set(2);
        this.renderer.render(this.scene, this.camera);

        gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);

        this.camera.layers.set(0);
        this.renderer.render(this.scene, this.camera);

        this.renderer.autoClear = true;
    }
}