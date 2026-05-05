<template>
  <div class="agent-manage-panel">
    <div class="header">
      <h2>代理管理</h2>
      <el-button type="primary" @click="showDialog = true">创建代理</el-button>
    </div>
    <div class="toolbar">
      <el-input
        v-model="keyword"
        clearable
        placeholder="输入账号筛选代理"
      />
    </div>
    <el-table :data="agentList" style="width: 100%">
      <el-table-column prop="username" label="账号" />
      <el-table-column prop="role" label="角色">
        <template #default>
          代理
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 'disabled' ? 'danger' : 'success'" effect="light">
            {{ row.status === 'disabled' ? '已封号' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginAt" label="最近登录时间" min-width="180">
        <template #default="{ row }">
          {{ row.lastLoginAt || '--' }}
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginIp" label="最近登录IP" min-width="140">
        <template #default="{ row }">
          {{ row.lastLoginIp || '--' }}
        </template>
      </el-table-column>
      <el-table-column prop="lastActiveAt" label="最近访问时间" min-width="180">
        <template #default="{ row }">
          {{ row.lastActiveAt || '--' }}
        </template>
      </el-table-column>
      <el-table-column prop="lastActiveIp" label="最近访问IP" min-width="140">
        <template #default="{ row }">
          {{ row.lastActiveIp || '--' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <div class="actions">
            <el-button
              link
              type="primary"
              :loading="actionUserId === row.userId && actionType === 'toggle'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'disabled' ? '解封' : '封号' }}
            </el-button>
            <el-button
              link
              type="danger"
              :loading="actionUserId === row.userId && actionType === 'delete'"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showDialog" title="创建代理" width="420">
      <el-form ref="formRef" :model="formData" label-width="80px">
        <el-form-item
          label="账号"
          prop="username"
          :rules="[{ required: true, message: '请输入账号', trigger: 'blur' }]"
        >
          <el-input v-model="formData.username" />
        </el-form-item>
        <el-form-item
          label="密码"
          prop="password"
          :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]"
        >
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
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createAgent, deleteAgent, getAgentList, updateAgentStatus } from '@/management/api/space'
import { CODE_MAP } from '@/management/api/base'

const keyword = ref('')
const showDialog = ref(false)
const submitting = ref(false)
const actionUserId = ref('')
const actionType = ref<'toggle' | 'delete' | ''>('')
const formRef = ref<any>(null)
const agentList = ref<any[]>([])
const formData = reactive({
  username: '',
  password: ''
})

const fetchAgents = async (searchKeyword = keyword.value) => {
  const res: any = await getAgentList(searchKeyword)
  if (res.code === CODE_MAP.SUCCESS) {
    agentList.value = res.data || []
  } else {
    agentList.value = []
  }
}

const setAction = (userId = '', type: 'toggle' | 'delete' | '' = '') => {
  actionUserId.value = userId
  actionType.value = type
}

watch(keyword, (value) => {
  fetchAgents(value)
})

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
        keyword.value = ''
        fetchAgents('')
      } else {
        ElMessage.error(res.errmsg || '代理创建失败')
      }
    } finally {
      submitting.value = false
    }
  })
}

const handleToggleStatus = async (row: any) => {
  const nextStatus = row.status === 'disabled' ? 'active' : 'disabled'
  const actionText = nextStatus === 'disabled' ? '封号' : '解封'
  try {
    await ElMessageBox.confirm(`确认要${actionText}代理账号“${row.username}”吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (error) {
    return
  }

  setAction(row.userId, 'toggle')
  try {
    const res: any = await updateAgentStatus({
      userId: row.userId,
      status: nextStatus
    })
    if (res.code === CODE_MAP.SUCCESS) {
      ElMessage.success(`${actionText}成功`)
      await fetchAgents(keyword.value)
    } else {
      ElMessage.error(res.errmsg || `${actionText}失败`)
    }
  } finally {
    setAction()
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确认要删除代理账号“${row.username}”吗？删除后不可恢复。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (error) {
    return
  }

  setAction(row.userId, 'delete')
  try {
    const res: any = await deleteAgent(row.userId)
    if (res.code === CODE_MAP.SUCCESS) {
      ElMessage.success('删除成功')
      await fetchAgents(keyword.value)
    } else {
      ElMessage.error(res.errmsg || '删除失败')
    }
  } finally {
    setAction()
  }
}

onMounted(() => fetchAgents(''))
</script>

<style lang="scss" scoped>
.agent-manage-panel {
  padding: 24px 32px;
  background: #fff;
  min-height: calc(100vh - 120px);
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
  max-width: 320px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
