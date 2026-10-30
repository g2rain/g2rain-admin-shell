<template>
  <div class="tenant-provision-container">
    <el-card class="form-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">{{ $t('MS_TP_TITLE', '账号开通设置') }}</span>
        </div>
      </template>

      <el-alert
        v-if="!canProvision"
        type="warning"
        show-icon
        :title="$t('MS_TP_ADMIN_BLOCK', '当前为运营机构账号，不允许加入或创建任何租户')"
        class="provision-alert"
      />
      <el-collapse
        v-else
        v-model="activeCollapse"
        accordion
        class="provision-collapse"
      >
        <el-collapse-item name="join">
          <template #title>
            <span :class="['collapse-title', activeCollapse === 'join' && 'collapse-title--active']">
              {{ $t('MS_TP_JOIN', '加入机构') }}
            </span>
          </template>
          <el-form
            ref="joinFormRef"
            :model="joinForm"
            :rules="joinRules"
            label-position="top"
            class="provision-form"
          >
            <el-form-item :label="$t('MS_TP_INVITE', '机构邀请码')" prop="inviteCode">
              <el-input
                v-model="joinForm.inviteCode"
                :placeholder="$t('MS_TP_INVITE_PH', '请输入机构邀请码')"
                maxlength="64"
                show-word-limit
              />
            </el-form-item>

            <div class="form-actions">
              <el-button
                type="primary"
                size="large"
                class="submit-btn"
                :disabled="!canProvision"
                :loading="joinSubmitting"
                @click="submitJoin"
              >
                {{ $t('MS_TP_JOIN', '加入机构') }}
              </el-button>
            </div>
          </el-form>
        </el-collapse-item>

        <el-collapse-item name="create">
          <template #title>
            <span :class="['collapse-title', activeCollapse === 'create' && 'collapse-title--active']">
              {{ $t('MS_TP_CREATE', '创建新机构') }}
            </span>
          </template>
          <el-form
            ref="editFormRef"
            :model="editForm"
            :rules="editRules"
            label-position="top"
            class="provision-form"
          >
            <el-form-item :label="$t('MS_TP_ORG_NAME', '机构名称')" prop="organName">
              <el-input
                v-model="editForm.organName"
                :placeholder="$t('MS_TP_ORG_NAME_PH', '请输入机构名称')"
              />
            </el-form-item>

            <el-form-item :label="$t('G2_FIELD_REAL_NAME', '真实姓名')" prop="realName">
              <el-input
                v-model="editForm.realName"
                :placeholder="$t('G2_PH_REALNAME', '请输入真实姓名')"
              />
            </el-form-item>

            <el-form-item :label="$t('G2_FIELD_EMAIL', '邮箱地址')" prop="email">
              <el-input
                v-model="editForm.email"
                :placeholder="$t('G2_PH_EMAIL', '请输入邮箱地址')"
              />
            </el-form-item>

            <el-form-item :label="$t('G2_FIELD_MOBILE', '手机号码')" prop="mobile">
              <el-input
                v-model="editForm.mobile"
                :placeholder="$t('G2_PH_MOBILE', '请输入手机号码')"
              />
            </el-form-item>

            <div class="form-actions">
              <el-button
                type="primary"
                size="large"
                class="submit-btn"
                :disabled="!canProvision"
                @click="submitEdit"
              >
                {{ $t('MS_TP_SUBMIT', '开通') }}
              </el-button>
            </div>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { t } from '../../platform/i18n'
import { getAuthorityUser } from '../../runtime/api/authority-user'
import { sso } from '../../runtime/auth/sso'
import type { TenantProvisionPayload } from './tenant_provision/type'
import { TenantProvisionApi } from './tenant_provision/api'

const activeCollapse = ref<'join' | 'create'>('join')
const canProvision = ref(true)
const joinSubmitting = ref(false)

const joinFormRef = ref<FormInstance | null>(null)
const joinForm = reactive({
  inviteCode: '',
})

const joinRules = computed<FormRules>(() => ({
  inviteCode: [
    { required: true, message: t('G2_VLD_REQ_INVITE', '请输入机构邀请码'), trigger: 'blur' },
    {
      pattern: /^[0-9a-fA-F-]{32,64}$/,
      message: t('G2_VLD_INVITE_FMT', '请输入有效的机构邀请码'),
      trigger: 'blur',
    },
  ],
}))

const editFormRef = ref<FormInstance | null>(null)
const editForm = reactive({
  organName: '',
  realName: '',
  email: '',
  mobile: '',
})

const editRules = computed<FormRules>(() => ({
  organName: [{ required: true, message: t('G2_VLD_REQ_ORG_NAME', '请输入机构名称'), trigger: 'blur' }],
  realName: [{ required: true, message: t('G2_VLD_REQ_REALNAME', '请输入真实姓名'), trigger: 'blur' }],
  email: [{ required: false, message: t('G2_PH_EMAIL', '请输入邮箱地址'), trigger: 'blur' }],
  mobile: [{ required: false, message: t('G2_PH_MOBILE', '请输入手机号码'), trigger: 'blur' }],
}))

const submitJoin = async () => {
  if (!joinFormRef.value) return
  const valid = await joinFormRef.value.validate()
  if (!valid) return

  joinSubmitting.value = true
  try {
    const user = await TenantProvisionApi.joinOrgan({
      inviteCode: joinForm.inviteCode.trim(),
    })
    try {
      await sso.switchToken(user.id)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t('MS_TP_JOIN_FAIL', '加入机构失败')
      ElMessage.error(msg)
      return
    }
    ElMessage.success(t('MS_TP_JOIN_OK', '加入机构成功'))
    setTimeout(() => window.location.reload(), 300)
  } finally {
    joinSubmitting.value = false
  }
}

const submitEdit = async () => {
  if (!editFormRef.value) return
  const valid = await editFormRef.value.validate()
  if (!valid) return

  const payload: TenantProvisionPayload = {
    organType: 'COMPANY',
    organName: editForm.organName,
    realName: editForm.realName,
    email: editForm.email,
    mobile: editForm.mobile,
  }

  const user = await TenantProvisionApi.provisionAccount(payload)
  try {
    await sso.switchToken(user.id)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('MS_TP_CREATE_FAIL', '开通失败')
    ElMessage.error(msg)
    return
  }
  ElMessage.success(t('MS_TP_CREATE_OK', '开通成功'))
  setTimeout(() => window.location.reload(), 300)
}

onMounted(async () => {
  try {
    const authorityUser = await getAuthorityUser()
    canProvision.value = !authorityUser.organ?.admin
  } catch (error: unknown) {
    console.error('加载当前用户信息失败:', error)
  }
})
</script>

<style scoped>
.tenant-provision-container {
  padding: 20px;
  background-color: var(--g2-bg-page);
  min-height: 100%;
  box-sizing: border-box;
  color: var(--g2-text-primary);
}

.form-card {
  width: 100%;
  background-color: var(--g2-bg-container);
}

.card-header {
  font-weight: bold;
  font-size: 18px;
}

.collapse-title {
  font-size: 14px;
  color: var(--g2-text-regular);
}

.collapse-title--active {
  color: var(--g2-color-primary);
  font-weight: 600;
}

.provision-form {
  padding: 10px 20px;
}

.form-actions {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--g2-border-color-light);
  text-align: center;
}

.submit-btn {
  width: 160px;
}

.provision-alert {
  margin-bottom: 16px;
}
</style>
