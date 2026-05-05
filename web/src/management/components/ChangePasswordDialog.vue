<template>
  <el-dialog :model-value="visible" title="修改密码" width="420" @close="handleClose">
    <el-form ref="formRef" :model="formData" label-width="90px">
      <el-form-item label="旧密码" prop="oldPassword" :rules="rules.oldPassword">
        <el-input v-model="formData.oldPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword" :rules="rules.newPassword">
        <el-input v-model="formData.newPassword" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { changePassword } from '@/management/api/auth'
import { CODE_MAP } from '@/management/api/base'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'success'])

const formRef = ref<any>(null)
const submitting = ref(false)
const formData = reactive({
  oldPassword: '',
  newPassword: ''
})

const rules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 16, message: '长度在 6 到 16 个字符', trigger: 'blur' }
  ]
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      formData.oldPassword = ''
      formData.newPassword = ''
    }
  }
)

const handleClose = () => {
  emit('close')
}

const handleSubmit = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      return
    }
    submitting.value = true
    try {
      const res: any = await changePassword(formData)
      if (res.code === CODE_MAP.SUCCESS) {
        ElMessage.success('密码修改成功')
        emit('success')
        handleClose()
      } else {
        ElMessage.error(res.errmsg || '密码修改失败')
      }
    } finally {
      submitting.value = false
    }
  })
}
</script>
