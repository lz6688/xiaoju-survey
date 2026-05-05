<template>
  <el-dialog :model-value="visible" title="分配代理" width="480" @close="emit('close')">
    <div class="search-row">
      <el-input v-model="keyword" placeholder="搜索代理账号" @keyup.enter="fetchAgents" />
      <el-button @click="fetchAgents">搜索</el-button>
    </div>
    <el-checkbox-group v-model="selectedAgentIds" class="agent-list">
      <el-checkbox v-for="item in agents" :key="item.userId" :label="item.userId">
        {{ item.username }}
      </el-checkbox>
    </el-checkbox-group>
    <template #footer>
      <el-button @click="emit('close')">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getAgentList } from '@/management/api/space'
import { assignAgents } from '@/management/api/survey'
import { CODE_MAP } from '@/management/api/base'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  surveyId: {
    type: String,
    default: ''
  },
  agentIds: {
    type: Array as () => string[],
    default: () => []
  }
})

const emit = defineEmits(['close', 'success'])

const keyword = ref('')
const submitting = ref(false)
const agents = ref<any[]>([])
const selectedAgentIds = ref<string[]>([])

const fetchAgents = async () => {
  const res: any = await getAgentList(keyword.value)
  if (res.code === CODE_MAP.SUCCESS) {
    agents.value = res.data || []
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      selectedAgentIds.value = [...props.agentIds]
      fetchAgents()
    } else {
      keyword.value = ''
      selectedAgentIds.value = []
    }
  }
)

const handleSubmit = async () => {
  submitting.value = true
  try {
    const res: any = await assignAgents({
      surveyId: props.surveyId,
      agentIds: selectedAgentIds.value
    })
    if (res.code === CODE_MAP.SUCCESS) {
      ElMessage.success('代理分配成功')
      emit('success')
    } else {
      ElMessage.error(res.errmsg || '代理分配失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.search-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
