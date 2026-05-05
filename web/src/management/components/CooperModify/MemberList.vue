<template>
  <div class="list-wrapper" v-if="list.length">
    <div class="content" v-for="(item, index) in list" :key="item.userId">
      <div class="user-info">
        <span>{{ item.username }}</span>
        <span v-if="item.accountRole" class="role-tag">
          {{ accountRoleLabels[item.accountRole] || '代理' }}
        </span>
      </div>
      <div class="operation">
        <OperationSelect
          :options="options"
          v-model="item.role"
          :multiple="multiple"
          @customClick="() => handleRemove(index)"
          :disabled="item.userId === currentUserId"
        ></OperationSelect>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import {
  accountRoleLabels,
  type IMember,
  type ListItem
} from '@/management/utils/workSpace'
import OperationSelect from './OperationSelect.vue'
import { useWorkSpaceStore } from '@/management/stores/workSpace'

const workSpaceStore = useWorkSpaceStore()
const props = withDefaults(
  defineProps<{
    members: IMember[]
    options: ListItem[]
    multiple: boolean
  }>(),
  {
    members: () => [],
    options: () => [],
    multiple: false
  }
)
const emit = defineEmits(['change'])
const list = computed({
  get() {
    return props.members
  },
  set(value) {
    emit('change', value)
  }
})
const currentUserId = computed(() => {
  return workSpaceStore.spaceDetail?.currentUserId
})
const handleRemove = (index: number) => {
  list.value.splice(index, 1)
}
</script>
<style lang="scss" scoped>
.list-wrapper {
  width: 100%;
  height: 200px;
  border: 1px solid #ccc;
  margin-top: 8px;
  overflow: auto;
  .head {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #ccc;
    padding: 0 20px;
  }
  .content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    gap: 16px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .role-tag {
      color: #606266;
      background: #f4f4f5;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 12px;
      line-height: 18px;
      white-space: nowrap;
    }

    .operation {
      display: flex;
      flex: 1;
      justify-content: flex-end;
    }
  }
}
</style>
