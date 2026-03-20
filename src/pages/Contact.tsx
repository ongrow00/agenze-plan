import { useState } from 'react'
import {
  Button, Text, Heading, Flex, Box, TextField, Callout,
} from '@radix-ui/themes'
import { ArrowRightIcon, ArrowLeftIcon, PersonIcon, EnvelopeClosedIcon, MobileIcon } from '@radix-ui/react-icons'
import * as Label from '@radix-ui/react-label'
import { useQuizStore } from '@/store/quizStore'
import { Navbar } from '@/components/layout/Navbar'

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

interface FieldError { name?: string; email?: string; phone?: string }

export function Contact() {
  const { contact, setContact, setStep } = useQuizStore()
  const [errors, setErrors] = useState<FieldError>({})
  const [rawPhone, setRawPhone] = useState(
    contact.phone ? formatPhone(contact.phone) : ''
  )

  function validate(): boolean {
    const errs: FieldError = {}
    if (!contact.name.trim()) errs.name = 'Informe seu nome'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
      errs.email = 'E-mail inválido'
    const digits = rawPhone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 11)
      errs.phone = 'Telefone inválido — informe DDD + número'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      setContact({ ...contact, phone: rawPhone.replace(/\D/g, '') })
      setStep('quiz')
    }
  }

  const actionBtnStyle = {
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    height: 60,
    minHeight: 60,
    boxSizing: 'border-box' as const,
  }

  return (
    <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <Box className="contact-scroll">
        <Box style={{ width: '100%', maxWidth: 440, margin: '0 auto' }} pt="4" className="animate-fade-up">

          {/* Header */}
          <Flex direction="column" align="start" gap="2" mb="6" style={{ textAlign: 'left' }}>
            <Heading size="6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Informe seus dados abaixo.
            </Heading>
            <Text size="2" color="gray">
              Usaremos seus dados para gerar o seu plano personalizado agora.
            </Text>
          </Flex>

          {/* Form */}
          <form id="contact-form" onSubmit={handleSubmit} noValidate>
            <Flex direction="column" gap="4">

              {/* Name */}
              <Box>
                <Label.Root htmlFor="name">
                  <Text as="div" size="2" weight="medium" mb="1">
                    <PersonIcon style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--accent-9)' }} />
                    Nome
                  </Text>
                </Label.Root>
                <TextField.Root
                  id="name"
                  size="3"
                  placeholder="Como quer ser chamado"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  autoComplete="name"
                  color={errors.name ? 'red' : 'indigo'}
                />
                {errors.name && <Text size="1" color="red" mt="1">{errors.name}</Text>}
              </Box>

              {/* Email */}
              <Box>
                <Label.Root htmlFor="email">
                  <Text as="div" size="2" weight="medium" mb="1">
                    <EnvelopeClosedIcon style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--accent-9)' }} />
                    E-mail
                  </Text>
                </Label.Root>
                <TextField.Root
                  id="email"
                  size="3"
                  type="email"
                  placeholder="joao@email.com"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  autoComplete="email"
                  color={errors.email ? 'red' : 'indigo'}
                />
                {errors.email && <Text size="1" color="red" mt="1">{errors.email}</Text>}
              </Box>

              {/* Phone */}
              <Box>
                <Label.Root htmlFor="phone">
                  <Text as="div" size="2" weight="medium" mb="1">
                    <MobileIcon style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--accent-9)' }} />
                    WhatsApp / Telefone
                  </Text>
                </Label.Root>
                <TextField.Root
                  id="phone"
                  size="3"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={rawPhone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    setRawPhone(formatted)
                    setContact({ ...contact, phone: formatted.replace(/\D/g, '') })
                  }}
                  autoComplete="tel"
                  color={errors.phone ? 'red' : 'indigo'}
                />
                {errors.phone && <Text size="1" color="red" mt="1">{errors.phone}</Text>}
              </Box>

              {Object.keys(errors).length > 0 && (
                <Callout.Root color="red" size="1">
                  <Callout.Text>Corrija os campos destacados para continuar.</Callout.Text>
                </Callout.Root>
              )}
            </Flex>
          </form>
        </Box>
      </Box>

      <Flex className="contact-footer" align="center">
        <Box style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
          <Flex gap="3" align="center">
            <Button
              type="button"
              variant="soft"
              color="gray"
              style={actionBtnStyle}
              onClick={() => setStep('welcome')}
            >
              <ArrowLeftIcon /> Voltar
            </Button>
            <Button
              type="submit"
              form="contact-form"
              style={{ ...actionBtnStyle, flex: 1 }}
            >
              Iniciar plano
              <ArrowRightIcon />
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}
