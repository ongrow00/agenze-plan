import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Text, Heading, Flex, Box, Dialog, TextField, Badge, Separator, Spinner,
} from '@radix-ui/themes'
import { ArrowRightIcon, PersonIcon, CalendarIcon } from '@radix-ui/react-icons'
import { supabase } from '@/lib/supabase'

type DialogStep = 'form' | 'preview'

interface FoundPlan {
  planId: string
  email: string
  profileId: string
  profileName: string
  createdAt: string
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function normalizeEmail(v: string) {
  return v.trim().toLowerCase()
}

function normalizePhone(v: string) {
  return v.replace(/\D/g, '')
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function AccessDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate()

  const [step, setStep] = useState<DialogStep>('form')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [foundPlans, setFoundPlans] = useState<FoundPlan[]>([])

  function reset() {
    setStep('form')
    setEmail('')
    setPhone('')
    setError('')
    setFoundPlans([])
  }

  function handleClose(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  async function handleSearch() {
    setError('')
    if (!email.trim()) { setError('Informe seu e-mail.'); return }

    setLoading(true)
    try {
      const normalEmail = normalizeEmail(email)
      const normalPhone = normalizePhone(phone)

      // Find lead by email
      const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('id, email, phone, profile_id')
        .ilike('email', normalEmail)
      if (leadError) throw leadError

      if (!leads || leads.length === 0) {
        setError('Nenhum plano encontrado com esse e-mail. Verifique e tente novamente.')
        return
      }

      // Normalize/filter in client to avoid formatting differences in DB.
      const emailMatchedLeads = leads.filter((l) => normalizeEmail((l.email as string) ?? '') === normalEmail)
      const leadsAfterPhoneFilter = normalPhone
        ? emailMatchedLeads.filter((l) => normalizePhone((l.phone as string | null) ?? '') === normalPhone)
        : emailMatchedLeads

      if (leadsAfterPhoneFilter.length === 0) {
        setError('Nenhum plano encontrado com esse e-mail/telefone. Verifique e tente novamente.')
        return
      }

      // All plans for matching leads (newest first).
      const matchingLeadIds = leadsAfterPhoneFilter.map((l) => l.id as string)
      const { data: plans, error: planError } = await supabase
        .from('plans')
        .select('id, lead_id, profile_id, content, created_at')
        .in('lead_id', matchingLeadIds)
        .order('created_at', { ascending: false })

      if (planError) throw planError
      if (!plans || plans.length === 0) {
        setError('Plano não encontrado. Tente criar um novo diagnóstico.')
        return
      }

      const list: FoundPlan[] = plans.map((p) => {
        const content = p.content as { profileName?: string }
        const lead =
          leadsAfterPhoneFilter.find((l) => (l.id as string) === (p.lead_id as string))
          ?? leadsAfterPhoneFilter[0]
        return {
          planId: p.id as string,
          email: lead.email as string,
          profileId: p.profile_id as string,
          profileName: content?.profileName ?? (p.profile_id as string),
          createdAt: p.created_at as string,
        }
      })

      setFoundPlans(list)
      setStep('preview')
    } catch {
      setError('Erro ao buscar plano. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function openPlan(planId: string) {
    navigate(`/plan/${planId}`)
    handleClose(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        {step === 'form' ? (
          <>
            <Dialog.Title>Acessar plano existente</Dialog.Title>
            <Dialog.Description mb="4" size="2" color="gray">
              Informe o e-mail e o telefone que você usou ao criar o plano.
            </Dialog.Description>

            <Flex direction="column" gap="3" mb="4">
              <Box>
                <Text as="div" size="2" weight="medium" mb="1">E-mail</Text>
                <TextField.Root
                  size="3"
                  type="email"
                  placeholder="joao@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </Box>
              <Box>
                <Text as="div" size="2" weight="medium" mb="1">
                  WhatsApp / Telefone
                </Text>
                <TextField.Root
                  size="3"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </Box>

              {error && (
                <Text size="1" color="red">{error}</Text>
              )}
            </Flex>

            <Flex
              gap="3"
              justify="end"
              align="center"
              style={{ height: 60, minHeight: 60 }}
            >
              <Dialog.Close>
                <Button variant="soft" color="gray" style={{ cursor: 'pointer' }}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button
                style={{ cursor: 'pointer' }}
                onClick={handleSearch}
                disabled={!email.trim() || loading}
              >
                {loading ? <Spinner size="1" /> : <ArrowRightIcon />}
                {loading ? 'Buscando…' : 'Buscar plano'}
              </Button>
            </Flex>
          </>
        ) : (
          <>
            <Dialog.Title>
              {foundPlans.length > 1 ? 'Planos encontrados' : 'Plano encontrado'}
            </Dialog.Title>
            <Dialog.Description mb="4" size="2" color="gray">
              {foundPlans.length > 1
                ? 'Toque em um dos planos abaixo para abrir.'
                : 'Toque no card abaixo para abrir seu plano.'}
            </Dialog.Description>

            <Flex direction="column" gap="3" mb="4" style={{ maxHeight: 'min(50vh, 360px)', overflowY: 'auto' }}>
              {foundPlans.map((fp) => (
                <button
                  key={fp.planId}
                  type="button"
                  onClick={() => openPlan(fp.planId)}
                  style={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    display: 'block',
                    width: '100%',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-3)',
                    border: '1px solid var(--gray-4)',
                    background: 'var(--gray-2)',
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-8)'
                    e.currentTarget.style.background = 'var(--gray-3)'
                    e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-4)'
                    e.currentTarget.style.background = 'var(--gray-2)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Flex direction="column" gap="3">
                    <Flex align="start" justify="between" gap="3">
                      <Badge
                        size="2"
                        style={{ background: 'var(--accent-9)', color: '#fff', width: 'fit-content' }}
                      >
                        {fp.profileId}
                      </Badge>
                      <ArrowRightIcon
                        aria-hidden
                        style={{ color: 'var(--accent-9)', flexShrink: 0, marginTop: 2 }}
                      />
                    </Flex>

                    <Heading size="5" style={{ lineHeight: 1.2 }}>
                      {fp.profileName}
                    </Heading>

                    <Separator size="4" />

                    <Flex direction="column" gap="2">
                      <Flex align="center" gap="2">
                        <PersonIcon style={{ color: 'var(--gray-9)', flexShrink: 0 }} />
                        <Text size="2" color="gray">
                          {fp.email}
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2">
                        <ArrowRightIcon style={{ color: 'var(--accent-9)', flexShrink: 0 }} />
                        <Text size="2">
                          Objetivo:{' '}
                          <Text weight="bold">R$10.000/mês</Text>
                        </Text>
                      </Flex>

                      <Flex align="center" gap="2">
                        <CalendarIcon style={{ color: 'var(--gray-9)', flexShrink: 0 }} />
                        <Text size="2" color="gray">
                          Gerado em {formatDate(fp.createdAt)}
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                </button>
              ))}
            </Flex>

            <Flex
              gap="3"
              justify="end"
              align="center"
              style={{ height: 60, minHeight: 60 }}
            >
              <Button
                variant="soft"
                color="gray"
                style={{ cursor: 'pointer' }}
                onClick={() => setStep('form')}
              >
                Voltar
              </Button>
            </Flex>
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  )
}
