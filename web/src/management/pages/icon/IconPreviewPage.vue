<template>
  <div class="icon-preview-page">
    <div class="page-header">
      <div>
        <h1>图标预览</h1>
        <p>管理端本地图标清单，共 {{ icons.length }} 个</p>
      </div>
    </div>

    <div class="icon-grid">
      <div v-for="icon in icons" :key="icon" class="icon-card">
        <div class="icon-box">
          <i class="iconfont preview-icon" :class="icon"></i>
        </div>
        <div class="icon-name">{{ icon }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const icons = [
  'icon-xuhao1',
  'icon-shangchuanchenggong',
  'icon-shangchuan1',
  'icon-xuhao2',
  'icon-cai',
  'icon-xiazai',
  'icon-zan',
  'icon-fasong',
  'icon-tiwenmoban',
  'icon-gengxin',
  'icon-kongbaichuangjian',
  'icon-Exceldaoru',
  'icon-wenbendaoru',
  'icon-AIshengcheng',
  'icon-icon_qianrushiwenjuan',
  'icon-icon_xiaochengxu',
  'icon-icon_qiyong',
  'icon-icon_SDK',
  'icon-icon_shanchu',
  'icon-icon_guanbi',
  'icon-icon_qianrushi',
  'icon-a-icon_SDK2',
  'icon-icon_zhongmingming',
  'icon-tixing-duojiliandong',
  'icon-gengduo',
  'icon-suoxiao',
  'icon-fangda',
  'icon-shiying',
  'icon-gauge',
  'icon-pie',
  'icon-bar',
  'icon-shujuliebiao',
  'icon-fentitongji',
  'icon-huishouzhan',
  'icon-wodekongjian',
  'icon-tuanduikongjian',
  'icon-shanchu1',
  'icon-bufenquanxian',
  'icon-quanbuquanxian',
  'icon-yidong',
  'icon-yulan',
  'icon-NPSpingfen',
  'icon-yangshishezhi',
  'icon-bangzhu',
  'icon-shangchuan',
  'icon-fuzhi',
  'icon-lishi',
  'icon-baocun',
  'icon-fanhui',
  'icon-bianji',
  'icon-shujutongji',
  'icon-toufang',
  'icon-wenjuanbianji',
  'icon-jieguoyeshezhi',
  'icon-wenjuanshezhi',
  'icon-jiantou',
  'icon-shangyi',
  'icon-xiayi',
  'icon-tuodong',
  'icon-shanchu',
  'icon-tixing-toupiao',
  'icon-tixing-duoxuan',
  'icon-tixing-panduanti',
  'icon-tixing-danxuan',
  'icon-tixing-pingfen',
  'icon-tixing-chengshixuanze',
  'icon-tixing-duohangshuru',
  'icon-tixing-danhangshuru',
  'icon-tixing-tiankongti',
  'icon-tixing-tupian',
  'icon-chuangjian',
  'icon-jinru',
  'icon-erweima'
]
</script>

<style lang="scss" scoped>
.icon-preview-page {
  min-height: 100vh;
  padding: 32px;
  background: #f6f7f9;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    margin: 0;
    font-size: 28px;
    color: #303133;
  }

  p {
    margin: 8px 0 0;
    color: #909399;
    font-size: 14px;
  }
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.icon-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 128px;
}

.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  border-radius: 8px;
  background: #fef6e6;
}

.preview-icon {
  font-size: 30px;
  color: #faa600;
}

.icon-name {
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
  word-break: break-all;
}
</style>
