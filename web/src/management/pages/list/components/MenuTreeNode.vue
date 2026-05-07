<template>
  <el-sub-menu
    v-if="node.children?.length"
    :index="node.id.toString()"
    default-opened
    class="tree-node"
    :style="{ '--tree-node-padding': `${45 + level * 20}px` }"
    :class="[activeValue === node.id ? 'check-item' : '']"
  >
    <template #title>
      <div class="title-box" @click.stop="emitSelect(node.id)">
        <p class="title-text">{{ node.name }}</p>
        <p class="title-total">{{ node.total }}</p>
      </div>
    </template>
    <MenuTreeNode
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :active-value="activeValue"
      :level="level + 1"
      @select="emitSelect"
    />
  </el-sub-menu>
  <el-menu-item
    v-else
    :index="node.id.toString()"
    :style="{ paddingLeft: `${45 + level * 20}px` }"
    :class="[activeValue === node.id ? 'check-item' : '']"
  >
    <div class="title-box">
      <p class="title-text">{{ node.name }}</p>
      <p class="title-total">{{ node.total }}</p>
    </div>
  </el-menu-item>
</template>

<script setup lang="ts">
import { type MenuItem } from '@/management/utils/workSpace'

withDefaults(
  defineProps<{
    node: MenuItem
    activeValue: string
    level?: number
  }>(),
  {
    level: 0
  }
)

const emit = defineEmits<{
  select: [id: string]
}>()

const emitSelect = (id: string) => {
  emit('select', id)
}
</script>

<style lang="scss" scoped>
.title-box {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.tree-node {
  :deep(> .el-sub-menu__title) {
    padding-left: var(--tree-node-padding) !important;
  }
}

.title-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-total {
  font-size: 14px;
  color: #92949d;
  text-align: right;
  font-weight: 400;
}
</style>
