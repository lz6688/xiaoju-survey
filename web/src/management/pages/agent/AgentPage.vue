<template>
  <div class="agent-page">
    <TopNav />
    <div class="content">
      <div class="header">
        <h2>代理管理</h2>
        <el-button type="primary" @click="showDialog = true">创建代理</el-button>
      </div>
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="输入账号搜索代理" @keyup.enter="fetchAgents" />
        <el-button @click="fetchAgents">搜索</el-button>
      </div>
      <el-table :data="agentList" style="width: 100%">
        <el-table-column prop="username" label="账号" />
        <el-table-column prop="role" label="角色">
          <template #default>
            代理
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showDialog" title="创建代理" width="420">
      <el-form ref="formRef" :model="formData" label-width="80px">
        <el-form-item label="账号" prop="username" :rules="[{ required: true, message: '请输入账号', trigger: 'blur' }]">
          <el-input v-model="formData.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password" :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]">
          <el-input v-model="formData.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import TopNav from '@/management/components/TopNav.vue'
import { createAgent, getAgentList } from '@/management/api/space'
import { CODE_MAP } from '@/management/api/base'

const keyword = ref('')
const showDialog = ref(false)
const submitting = ref(false)
const formRef = ref<any>(null)
const agentList = ref<any[]>([])
const formData = reactive({
  username: '',
  password: ''
})

const fetchAgents = async () => {
  const res: any = await getAgentList(keyword.value)
  if (res.code === CODE_MAP.SUCCESS) {
    agentList.value = res.data || []
  }
}

const handleCreate = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      return
    }
    submitting.value = true
    try {
      const res: any = await createAgent(formData)
      if (res.code === CODE_MAP.SUCCESS) {
        ElMessage.success('代理创建成功')
        showDialog.value = false
        formData.username = ''
        formData.password = ''
        fetchAgents()
      } else {
        ElMessage.error(res.errmsg || '代理创建失败')
      }
    } finally {
      submitting.value = false
    }
  })
}

onMounted(fetchAgents)
</script>

<style lang="scss" scoped>
.agent-page {
  min-height: 100vh;
  background: #f6f7f9;
}

.content {
  padding: 24px 32px;
}

.header,
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolbar {
  margin: 16px 0;
  justify-content: flex-start;
}
</style>
