<template>
  <div class="page-home">
    <!-- Hero 区域 -->
    <section class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <h1 class="hero-title">把你的图片<br/>变成<em>拼豆图纸</em></h1>
        <p class="hero-sub">上传任意图片，一键转换为拼豆色板图纸，开启你的像素创作之旅</p>
        <div class="hero-actions">
          <router-link to="/converter" class="btn-primary btn-lg">
            <span>🎨 立即制作</span>
          </router-link>
          <router-link to="/gallery" class="btn-outline btn-lg">
            浏览社区作品
          </router-link>
        </div>
      </div>
    </section>

    <!-- 特色功能 -->
    <section class="features-section">
      <h2 class="section-title">为什么选择拼豆工坊？</h2>
      <div class="features-grid">
        <div class="feature-card" v-for="f in features" :key="f.title">
          <div class="feature-icon">{{ f.icon }}</div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 使用步骤 -->
    <section class="steps-section">
      <h2 class="section-title">三步搞定</h2>
      <div class="steps-row">
        <div class="step" v-for="(s, i) in steps" :key="i">
          <div class="step-num">{{ i + 1 }}</div>
          <div class="step-icon">{{ s.icon }}</div>
          <h4>{{ s.title }}</h4>
          <p>{{ s.desc }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const features = [
  { icon: '🖼️', title: '图片转图纸', desc: '支持 JPG / PNG / WebP 格式，智能识别颜色，自动匹配拼豆色板' },
  { icon: '🎯', title: '多尺寸选择', desc: '从 24×24 到 64×64 多种网格尺寸，入门到高手都能找到合适的挑战' },
  { icon: '💾', title: '下载保存', desc: '生成高清拼豆图纸，可下载为图片，随时打印开始制作' },
  { icon: '👥', title: '社区分享', desc: '将自己的作品分享到社区，欣赏他人的创意，互相点赞鼓励' },
]

const steps = [
  { icon: '📤', title: '上传图片', desc: '选择你想转换的图片，支持裁剪和调整' },
  { icon: '⚙️', title: '自动转换', desc: '系统自动识别颜色，匹配拼豆色板，生成网格图纸' },
  { icon: '📥', title: '下载开拼', desc: '保存图纸，准备好拼豆和模板，开始你的创作' },
]
</script>

<style scoped>
/* ===== Hero ===== */
.hero-section {
  position: relative;
  padding: 100px 20px 80px;
  text-align: center;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #f5f0ff 0%, #e8f5ff 50%, #f0fff4 100%);
  z-index: -1;
}
.hero-bg::after {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124,77,255,0.08) 0%, transparent 70%);
  top: -200px;
  right: -100px;
}
.hero-content { max-width: 700px; margin: 0 auto; }
.hero-title {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.2;
  color: #1a1a2e;
  margin-bottom: 20px;
}
.hero-title em {
  font-style: normal;
  background: linear-gradient(135deg, #7c4dff, #00bcd4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  font-size: 18px;
  color: #666;
  line-height: 1.7;
  margin-bottom: 36px;
}
.hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

/* ===== Buttons ===== */
.btn-primary, .btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s;
}
.btn-lg { padding: 16px 36px; font-size: 17px; }
.btn-primary {
  background: linear-gradient(135deg, #7c4dff, #651fff);
  color: #fff;
  box-shadow: 0 4px 20px rgba(124,77,255,0.3);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(124,77,255,0.4);
}
.btn-outline {
  border: 2px solid #7c4dff;
  color: #7c4dff;
}
.btn-outline:hover {
  background: #7c4dff;
  color: #fff;
}

/* ===== Section ===== */
.section-title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 48px;
}

/* ===== Features ===== */
.features-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 20px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 24px;
}
.feature-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s;
}
.feature-card:hover {
  box-shadow: 0 8px 40px rgba(0,0,0,0.06);
  transform: translateY(-4px);
}
.feature-icon { font-size: 40px; margin-bottom: 16px; }
.feature-card h3 { font-size: 18px; font-weight: 600; color: #1a1a2e; margin-bottom: 8px; }
.feature-card p { font-size: 14px; color: #888; line-height: 1.6; }

/* ===== Steps ===== */
.steps-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 20px 100px;
}
.steps-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}
.step {
  text-align: center;
  position: relative;
  padding: 32px 20px;
  background: #fafafa;
  border-radius: 16px;
}
.step:not(:last-child)::after {
  content: '→';
  position: absolute;
  right: -24px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 28px;
  color: #ddd;
}
.step-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #7c4dff;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 16px;
}
.step-icon { font-size: 36px; margin-bottom: 12px; }
.step h4 { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 6px; }
.step p { font-size: 14px; color: #888; line-height: 1.5; }

@media (max-width: 640px) {
  .hero-title { font-size: 32px; }
  .steps-row { grid-template-columns: 1fr; }
  .step:not(:last-child)::after { display: none; }
}
</style>