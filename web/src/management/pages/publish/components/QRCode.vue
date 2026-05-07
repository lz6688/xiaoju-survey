<template>
  <div class="qrcode">
    <div class="qcode-mask">
      <el-popover
        ref="popover"
        :popper-class="'serve-qrcode-popover'"
        placement="top"
        trigger="hover"
      >
        <img :src="qRCodeImg" width="120" height="120" />
        <template #reference>
          <el-button>
            <i style="font-size: 24px" class="iconfont icon-erweima"></i>
          </el-button>
        </template>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import QRCode from 'qrcode'

interface Props {
  url: string
}

const props = defineProps<Props>()

const qRCodeImg = ref<string>('')

const convertUrlToQRCode = async (url: string) => {
  try {
    const res = await QRCode.toDataURL(url)
    if (props.url === url) {
      qRCodeImg.value = res
    }
  } catch (err) {
    console.log(err)
  }
}

watch(
  () => props.url,
  (value) => {
    if (!value) {
      qRCodeImg.value = ''
      return
    }

    convertUrlToQRCode(value)
  },
  {
    immediate: true
  }
)
</script>

<style lang="scss" scoped>
.qrcode {
  display: inline-block;
  overflow: hidden;

  .qcode-mask {
    display: flex;

    .el-button {
      color: #6e707c;
      height: 32px;
      line-height: 32px;
      width: 32px;
      padding: 0;
      border: none;
      background: transparent;
      font-size: 12px;
      text-align: center;
      transition: all 0.2s;
      &:hover {
        background: $background-color-gray;
        color: #6e707c;
        border: none;
      }
    }
  }
}

.el-popover.serve-qrcode-popover {
  height: 122px;
  min-width: 0;
  padding: 0;
}
</style>
