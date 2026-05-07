<template>
  <el-dialog
    class="base-dialog-root"
    :model-value="visible"
    width="40%"
    :title="formTitle"
    @close="onClose"
  >
    <el-form
      class="base-form-root"
      ref="ruleForm"
      :model="formModel"
      :rules="rules"
      label-position="top"
      size="large"
      @submit.prevent
    >
      <el-form-item label="分组名称" prop="name">
        <el-input v-model="formModel.name" />
      </el-form-item>
      <el-form-item label="上级分组">
        <el-select v-model="formModel.parentId" placeholder="设为一级分组" clearable>
          <el-option
            v-for="item in parentOptions"
            :key="item._id"
            :label="item.name"
            :value="item._id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" class="save-btn" @click="onConfirm"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, onMounted } from 'vue'
import { pick as _pick } from 'lodash-es'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'
import { storeToRefs } from 'pinia'

import { QOP_MAP } from '@/management/utils/constant'
import { type IGroup } from '@/management/utils/workSpace'
import { useWorkSpaceStore } from '@/management/stores/workSpace'

const workSpaceStore = useWorkSpaceStore()
const { groupAllList } = storeToRefs(workSpaceStore)
const emit = defineEmits(['on-close-codify'])
const props = defineProps({
  type: String,
  width: String,
  visible: Boolean
})
const ruleForm = shallowRef<any>(null)

const formTitle = computed(() => {
  return props.type === QOP_MAP.ADD ? '创建分组' : '管理分组'
})
const formModel = ref<Required<IGroup>>({
  _id: '',
  name: '',
  parentId: ''
})
const rules = {
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }]
}
const groupDetail = computed(() => {
  return workSpaceStore.groupDetail
})
const parentOptions = computed(() => {
  if (!formModel.value._id) {
    return groupAllList.value
  }

  const forbiddenIds = new Set(workSpaceStore.getGroupDescendantIds(formModel.value._id))

  return groupAllList.value.filter((item) => !item._id || !forbiddenIds.has(item._id))
})

onMounted(() => {
  if (props.type === QOP_MAP.EDIT) {
    formModel.value = {
      ..._pick(groupDetail.value as any, ['_id', 'name']),
      parentId: groupDetail.value?.parentId || ''
    }
  }
})
const onClose = () => {
  formModel.value = {
    _id: '',
    name: '',
    parentId: ''
  }
  // 清空空间详情
  workSpaceStore.setGroupDetail(null)
  emit('on-close-codify')
}

const onConfirm = async () => {
  ruleForm.value?.validate(async (valid: boolean) => {
    if (valid) {
      if (props.type === QOP_MAP.ADD) {
        try {
          await handleAdd()
          emit('on-close-codify')
        } catch (err) {
          ElMessage.error('createGroup status err' + err)
        }
      } else {
        try {
          await handleUpdate()
          emit('on-close-codify')
        } catch (err) {
          ElMessage.error('createGroup status err' + err)
        }
      }
    } else {
      return false
    }
  })
}

const handleUpdate = async () => {
  await workSpaceStore.updateGroup(formModel.value)
}
const handleAdd = async () => {
  await workSpaceStore.addGroup({ name: formModel.value.name, parentId: formModel.value.parentId })
}
</script>

<style lang="scss" rel="lang/scss" scoped>
.base-form-root {
  padding: 20px;
}
</style>
