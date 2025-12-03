import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Chiều cao toàn cây
export const TREE_HEIGHT = 6.250042204618238;

// Bán kính rộng nhất của tầng đáy
export const TREE_MAX_RADIUS = 3.5999973869888047;

// 6 tầng cây (đã đo từ model)
export const TREE_LEVELS = [
  { level: 1, minY: -0.19678269495239348, maxY: 0.8448910058173129, radius: 3.599998637760492 },
  { level: 2, minY: 0.8448910058173129, maxY: 1.8865647065870192, radius: 1.50 },
  { level: 3, minY: 1.8865647065870192, maxY: 2.928238407356725, radius: 1.20 },
  { level: 4, minY: 2.928238407356725, maxY: 3.9699121081264317, radius: 0.90 },
  { level: 5, minY: 3.969912108896139, maxY: 5.011585808896139, radius: 0.60 },
  { level: 6, minY: 5.011585808896139, maxY: 6.053259509665844, radius: 0.28 }
];

interface Message {
  id: number;
  description: string;
}

class ChristmasTreeScene {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private renderer!: THREE.WebGLRenderer;
  private loader!: GLTFLoader;
  private starField!: THREE.Points;

  private ornaments: THREE.Mesh[] = [];

  private snowParticles: THREE.Points | null = null;
  private snowGeometry: THREE.BufferGeometry | null = null;
  private snowMaterial: THREE.PointsMaterial | null = null;
  private snowPositions: Float32Array | null = null;
  private snowVelocities: Float32Array | null = null;
  private snowCount = 500;

  constructor() {
    this.init();
    this.setupResizeHandler();
    this.createSnow();
  }
  public addNewMessage(description: string) {
    // Tạo object message tạm thời (id tạm để tránh duplicate trong scene)
    const tempMessage = {
      id: Date.now(),
      description: description
    };
    // Tạo ornament ngay lập tức (optimistic UI)
    this.createOrnamentForMessage(tempMessage);
  }

  private init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(8, 5, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });

    // Đặt kích thước chính xác bằng viewport
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Quan trọng: ngăn canvas kéo dài quá viewport
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    // Thêm canvas vào body
    document.body.appendChild(this.renderer.domElement);

    // OrbitControls setup - SAU KHI đã có renderer
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0, 1, 0);
    this.controls.update();

    // Star field setup
    this.createStar();

    // Lights setup
    this.createLights();

    // Loader setup
    this.loader = new GLTFLoader();

    // Load the Christmas tree model
    this.loadTree();

    // Bắt đầu vòng lặp hoạt hình
    this.animate();

    this.fetchMessagesAndCreateOrnaments();
  }

  private setupResizeHandler() {
    // Xử lý sự kiện resize cửa sổ
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  private onWindowResize() {
    // Cập nhật kích thước camera
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // Cập nhật kích thước renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private async fetchMessagesAndCreateOrnaments() {
    try {
      const response = await fetch('https://christmas-tree-esnh.onrender.com/api/message');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const messages: Message[] = await response.json();

      console.log(`Fetched ${messages.length} messages`);

      messages.forEach(message => {
        this.createOrnamentForMessage(message);
      });

    } catch (error) {
      console.error('Failed to fetch messages:', error);
      this.createSampleOrnaments();
    }
  }

  private createOrnamentForMessage(message: Message) {
    const availableLevels = TREE_LEVELS.filter(level => level.level >= 2 && level.level <= 5);
    const randomLevelIndex = Math.floor(Math.random() * availableLevels.length);
    const level = availableLevels[randomLevelIndex];

    const angle = Math.random() * Math.PI * 2;
    const y = level.minY + Math.random() * (level.maxY - level.minY);
    const radiusFactor = 0.8 + Math.random() * 0.2;
    const radius = level.radius * radiusFactor;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const color = this.generateColorFromString(message.description);

    const geometry = new THREE.SphereGeometry(0.05, 16, 16); // Tăng độ mịn
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8, // TĂNG CƯỜNG ĐỘ PHÁT SÁNG
      roughness: 0.2, // GIẢM độ nhám để bóng hơn
      metalness: 0.3 // THÊM độ kim loại để sáng bóng
    });

    const ball = new THREE.Mesh(geometry, material);
    ball.position.set(x, y, z);
    ball.userData = { messageId: message.id, description: message.description };

    const light = new THREE.PointLight(color, 2, 2.5); // TĂNG cường độ ánh sáng
    light.position.set(x, y, z);

    this.scene.add(ball);
    this.scene.add(light);

    this.ornaments.push(ball);
    this.addHoverEffect(ball, message.description);
  }

  private generateColorFromString(str: string): number {
    // Palette màu Giáng Sinh truyền thống
    const christmasColors = [
      0xFF0000, // Đỏ
      0x00FF00, // Xanh lá
      0xFFD700, // Vàng
      0x1E90FF, // Xanh dương
      0xFF69B4, // Hồng
      0x00CED1, // Xanh ngọc
      0xFFA500, // Cam
      0x9370DB, // Tím
      0x32CD32, // Xanh lá sáng
      0xFF4500, // Đỏ cam
      0x40E0D0, // Ngọc sáng
    ];

    // Tạo index từ string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % christmasColors.length;

    return christmasColors[index];
  }

  private addHoverEffect(ball: THREE.Mesh, description: string) {
    const originalScale = ball.scale.clone();

    // Tạo tooltip đẹp hơn
    const tooltip = document.createElement('div');
    tooltip.style.position = 'fixed';
    tooltip.style.background = 'linear-gradient(135deg, rgba(26, 71, 42, 0.95), rgba(45, 90, 61, 0.95))';
    tooltip.style.color = '#FFD700';
    tooltip.style.padding = '12px 16px';
    tooltip.style.borderRadius = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    tooltip.style.zIndex = '1000';
    tooltip.style.fontSize = '14px';
    tooltip.style.fontWeight = '500';
    tooltip.style.border = '2px solid #FFD700';
    tooltip.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.5)';
    tooltip.style.backdropFilter = 'blur(10px)';
    tooltip.style.maxWidth = '250px';
    tooltip.style.textAlign = 'center';
    tooltip.style.lineHeight = '1.4';
    tooltip.textContent = description;

    document.body.appendChild(tooltip);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isHovering = false;
    let originalEmissiveIntensity = 0.3;

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(ball);

      if (intersects.length > 0) {
        if (!isHovering) {
          isHovering = true;

          // Hiệu ứng scale với easing
          this.animateScale(ball.scale, new THREE.Vector3(1.8, 1.8, 1.8), 0.3);

          // Tăng cường độ phát sáng
          const material = ball.material as THREE.MeshStandardMaterial;
          originalEmissiveIntensity = material.emissiveIntensity;
          material.emissiveIntensity = 1.0;

          // Hiệu ứng "pulse" nhẹ
          this.startPulseAnimation(ball);
        }

        // Hiệu ứng tooltip xuất hiện mượt mà
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(-100%) scale(1)';

        // Đặt vị trí tooltip
        const tooltipRect = tooltip.getBoundingClientRect();
        let left = event.clientX;
        let top = event.clientY - tooltipRect.height - 10;

        // Đảm bảo tooltip không ra ngoài màn hình
        if (top < 10) top = event.clientY + 20;
        if (left + tooltipRect.width > window.innerWidth - 10) {
          left = window.innerWidth - tooltipRect.width - 10;
        }
        if (left < 10) left = 10;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;

      } else {
        if (isHovering) {
          isHovering = false;

          // Hiệu ứng scale trở lại
          this.animateScale(ball.scale, originalScale, 0.3);

          // Khôi phục cường độ phát sáng
          const material = ball.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = originalEmissiveIntensity;

          // Dừng animation pulse
          this.stopPulseAnimation(ball);
        }

        // Ẩn tooltip mượt mà
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(-100%) scale(0.8)';
      }
    };

    document.addEventListener('mousemove', onMouseMove);

    // Thêm hiệu ứng khi click vào ornament
    const onClick = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(ball);

      if (intersects.length > 0) {
        // Hiệu ứng click - scale nhỏ lại rồi trở về
        this.animateClick(ball);
        // Hiệu ứng "sparkle" - tạo các hạt nhỏ bay ra
        this.createSparkleEffect(ball.position);
      }
    };

    document.addEventListener('click', onClick);

    // Cleanup function
    ball.userData.cleanupHover = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);

      if (ball.userData.pulseAnimationId) {
        cancelAnimationFrame(ball.userData.pulseAnimationId);
      }

      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    };
  }

  private animateScale(currentScale: THREE.Vector3, targetScale: THREE.Vector3, duration: number) {
    const startScale = currentScale.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Easing function
      const ease = this.easeOutCubic(progress);

      currentScale.lerpVectors(startScale, targetScale, ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private startPulseAnimation(ball: THREE.Mesh) {
    if (ball.userData.pulseAnimationId) {
      cancelAnimationFrame(ball.userData.pulseAnimationId);
    }

    const material = ball.material as THREE.MeshStandardMaterial;
    const originalIntensity = material.emissiveIntensity;
    let time = 0;

    const pulse = () => {
      if (!ball.userData.isHovering) return;

      time += 0.05;
      const pulseValue = Math.sin(time) * 0.3 + 0.7;
      material.emissiveIntensity = originalIntensity * pulseValue;

      ball.userData.pulseAnimationId = requestAnimationFrame(pulse);
    };

    ball.userData.isHovering = true;
    ball.userData.pulseAnimationId = requestAnimationFrame(pulse);
  }

  private stopPulseAnimation(ball: THREE.Mesh) {
    if (ball.userData.pulseAnimationId) {
      cancelAnimationFrame(ball.userData.pulseAnimationId);
      ball.userData.pulseAnimationId = null;
    }
    ball.userData.isHovering = false;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private animateClick(ball: THREE.Mesh) {
    const startScale = ball.scale.clone();
    const targetScale = new THREE.Vector3(1.2, 1.2, 1.2);
    const startTime = Date.now();
    const duration = 200;

    const animateClick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 0.5) {
        // Scale down
        const ease = this.easeOutCubic(progress * 2);
        ball.scale.lerpVectors(startScale, targetScale, ease);
      } else {
        // Scale back up
        const ease = this.easeOutCubic((progress - 0.5) * 2);
        ball.scale.lerpVectors(targetScale, startScale, ease);
      }

      if (progress < 1) {
        requestAnimationFrame(animateClick);
      }
    };

    animateClick();
  }

  private createSparkleEffect(position: THREE.Vector3) {
    const sparkleCount = 8;
    const sparkles: THREE.Mesh[] = [];

    for (let i = 0; i < sparkleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.01, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 1
      });

      const sparkle = new THREE.Mesh(geometry, material);
      sparkle.position.copy(position);

      // Random direction
      const angle = (i / sparkleCount) * Math.PI * 2;
      const speed = 0.02 + Math.random() * 0.02;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 0.02,
        Math.sin(angle) * speed
      );

      sparkle.userData.velocity = velocity;
      sparkle.userData.life = 1.0;

      this.scene.add(sparkle);
      sparkles.push(sparkle);
    }

    // Animation for sparkles
    const animateSparkles = () => {
      let allDead = true;

      sparkles.forEach(sparkle => {
        if (sparkle.userData.life > 0) {
          allDead = false;

          // Update position
          sparkle.position.add(sparkle.userData.velocity);

          // Update life and opacity
          sparkle.userData.life -= 0.02;
          const material = sparkle.material as THREE.MeshBasicMaterial;
          material.opacity = sparkle.userData.life;

          // Scale down
          sparkle.scale.setScalar(sparkle.userData.life);
        }
      });

      if (!allDead) {
        requestAnimationFrame(animateSparkles);
      } else {
        // Clean up sparkles
        sparkles.forEach(sparkle => {
          this.scene.remove(sparkle);
          if (sparkle.geometry) sparkle.geometry.dispose();
          if (sparkle.material) (sparkle.material as THREE.Material).dispose();
        });
      }
    };

    animateSparkles();
  }

  private createSampleOrnaments() {
    const sampleMessages: Message[] = [
      { id: 1, description: "Chúc mừng Giáng Sinh!" },
      { id: 2, description: "An lành và hạnh phúc" },
      { id: 3, description: "Peace & Love" },
      { id: 4, description: "Merry Christmas!" }
    ];

    sampleMessages.forEach(message => {
      this.createOrnamentForMessage(message);
    });
  }

  private loadTree() {
    this.loader.load(
      '/models/tree_and_ground.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(2, 2, 2);
        model.position.set(0, 0, 0);
        this.scene.add(model);

        const starLight1 = new THREE.PointLight(0xffee88, 5, 40);
        starLight1.position.set(0, 6, 0.15);
        this.scene.add(starLight1);

        const starLight2 = new THREE.PointLight(0xffee88, 5, 40);
        starLight2.position.set(0, 6, -0.15);
        this.scene.add(starLight2);

        console.log('Model loaded successfully');
      },
      (progressEvent) => {
        console.log(
          `Loading: ${((progressEvent.loaded / progressEvent.total) * 100).toFixed(2)}%`
        );
      },
      (error) => {
        console.error('An error happened while loading the model:', error);
      }
    );
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    if (this.snowParticles) {
      this.updateSnow();
    }
    this.renderer.render(this.scene, this.camera);
  }

  private createStar() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;

    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 2,
      sizeAttenuation: true
    });

    this.starField = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.starField);

    return this.starField;
  }

  private createLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.3);
    dir.position.set(3, 5, 3);
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0xffffff, 0.15);
    fill.position.set(-3, 2, -3);
    this.scene.add(fill);
  }

  private createSnow() {
    try {
      this.snowGeometry = new THREE.BufferGeometry();
      this.snowCount = Math.min(this.snowCount, 300); // Giữ nguyên số lượng

      this.snowPositions = new Float32Array(this.snowCount * 3);
      this.snowVelocities = new Float32Array(this.snowCount * 3);

      // Sử dụng khu vực tầng 1 (mặt đất)
      const groundLevel = TREE_LEVELS[0];
      const snowArea = {
        minX: -groundLevel.radius,
        maxX: groundLevel.radius,
        minY: groundLevel.minY,     // Bắt đầu từ đỉnh mặt đất
        maxY: groundLevel.maxY + 8, // Cao lên trên nhưng giới hạn bán kính
        minZ: -groundLevel.radius,
        maxZ: groundLevel.radius
      };

      console.log('Snow area:', snowArea);

      for (let i = 0; i < this.snowCount; i++) {
        const i3 = i * 3;

        // Vị trí ngẫu nhiên trong khu vực mặt đất + cao lên
        this.snowPositions[i3] = (Math.random() - 0.5) * 2 * groundLevel.radius;
        this.snowPositions[i3 + 1] = groundLevel.minY + Math.random() * 6; // Từ mặt đất lên cao 8 units
        this.snowPositions[i3 + 2] = (Math.random() - 0.5) * 2 * groundLevel.radius;

        // Vận tốc ngẫu nhiên
        this.snowVelocities[i3] = (Math.random() - 0.5) * 0.015;
        this.snowVelocities[i3 + 1] = -0.005 - Math.random() * 0.005;
        this.snowVelocities[i3 + 2] = (Math.random() - 0.5) * 0.015;
      }

      if (this.snowGeometry) {
        this.snowGeometry.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));

        // Material cho tuyết
        this.snowMaterial = new THREE.PointsMaterial({
          color: 0xFFFFFF,
          size: 0.07,
          transparent: true,
          opacity: 0.8,
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        this.snowParticles = new THREE.Points(this.snowGeometry, this.snowMaterial);
        this.scene.add(this.snowParticles);

        console.log('Snow effect created in ground area');
      }
    } catch (error) {
      console.error('Error creating snow effect:', error);
    }
  }

  private updateSnow() {
    if (!this.snowGeometry || !this.snowPositions || !this.snowVelocities) {
      return;
    }

    const positionAttribute = this.snowGeometry.getAttribute('position');
    if (!positionAttribute) {
      return;
    }

    const positions = positionAttribute.array as Float32Array;
    const groundLevel = TREE_LEVELS[0];

    // Khu vực tuyết rơi - chỉ trong bán kính mặt đất
    const snowArea = {
      minX: -groundLevel.radius * 1.2, // Mở rộng một chút
      maxX: groundLevel.radius * 1.2,
      minY: groundLevel.minY - 2,      // Cho phép rơi xuống dưới mặt đất một chút
      maxY: groundLevel.maxY + 10,     // Cao hơn một chút
      minZ: -groundLevel.radius * 1.2,
      maxZ: groundLevel.radius * 1.2
    };

    for (let i = 0; i < this.snowCount; i++) {
      const i3 = i * 3;

      // Cập nhật vị trí theo vận tốc
      positions[i3] += this.snowVelocities[i3];
      positions[i3 + 1] += this.snowVelocities[i3 + 1];
      positions[i3 + 2] += this.snowVelocities[i3 + 2];

      // Thêm chút ngẫu nhiên cho chuyển động tự nhiên
      this.snowVelocities[i3] += (Math.random() - 0.5) * 0.001;
      this.snowVelocities[i3 + 2] += (Math.random() - 0.5) * 0.001;

      // Kiểm tra và giới hạn theo bán kính mặt đất
      const distanceFromCenter = Math.sqrt(positions[i3] * positions[i3] + positions[i3 + 2] * positions[i3 + 2]);
      const maxRadius = groundLevel.radius * 1.2;

      if (distanceFromCenter > maxRadius) {
        // Đẩy trở lại vào trong bán kính
        const angle = Math.atan2(positions[i3 + 2], positions[i3]);
        positions[i3] = Math.cos(angle) * maxRadius * 0.95;
        positions[i3 + 2] = Math.sin(angle) * maxRadius * 0.95;

        // Đổi hướng velocity
        this.snowVelocities[i3] *= -0.5;
        this.snowVelocities[i3 + 2] *= -0.5;
      }

      // Reset snowflake khi chạm đất hoặc ra khỏi khu vực chiều cao
      if (positions[i3 + 1] < snowArea.minY) {
        // Reset lên trên cùng, trong bán kính mặt đất
        positions[i3 + 1] = snowArea.maxY;

        // Vị trí X,Z ngẫu nhiên trong bán kính mặt đất
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * groundLevel.radius;
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 2] = Math.sin(angle) * radius;

        this.snowVelocities[i3] = (Math.random() - 0.5) * 0.0025;
        this.snowVelocities[i3 + 1] = -0.002 - Math.random() * 0.002;
        this.snowVelocities[i3 + 2] = (Math.random() - 0.5) * 0.0025;
      }

      // Giới hạn chiều cao - nếu bay quá cao thì kéo xuống
      if (positions[i3 + 1] < groundLevel.minY) {
        positions[i3 + 1] = groundLevel.maxY + 8;
        this.snowVelocities[i3 + 1] = Math.min(this.snowVelocities[i3 + 1], -0.01);
      }
    }

    positionAttribute.needsUpdate = true;
  }

  // Thêm method để bật/tắt tuyết
  public toggleSnow(enable: boolean) {
    if (enable && !this.snowParticles) {
      this.createSnow();
    } else if (!enable && this.snowParticles) {
      this.disposeSnow();
    }
  }

  private disposeSnow() {
    if (this.snowParticles) {
      this.scene.remove(this.snowParticles);
      if (this.snowGeometry) {
        this.snowGeometry.dispose();
      }
      if (this.snowMaterial) {
        this.snowMaterial.dispose();
      }
      this.snowParticles = null;
      this.snowGeometry = null;
      this.snowMaterial = null;
      this.snowPositions = null;
      this.snowVelocities = null;
    }
  }

  // Sửa lại method setSnowIntensity
  public setSnowIntensity(intensity: number) {
    if (intensity === 0) {
      this.disposeSnow();
      return;
    }

    // intensity từ 0.1 đến 1
    const newCount = Math.floor(500 * intensity);
    if (!this.snowParticles) {
      this.snowCount = newCount;
      this.createSnow();
    } else if (this.snowMaterial) {
      this.snowMaterial.size = 0.04 + intensity * 0.04;
      this.snowMaterial.opacity = 0.5 + intensity * 0.3;
    }
  }
}

declare global {
  interface Window { treeScene?: any; }
}

document.addEventListener('DOMContentLoaded', () => {
  const scene = new ChristmasTreeScene();
  // expose an instance to window để index.html có thể gọi
  (window as any).treeScene = scene;
});