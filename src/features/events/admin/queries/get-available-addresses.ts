"use server"

import { prisma } from "@/lib/prisma"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"

// Buscar endereços disponíveis para eventos
export async function getAvailableAddresses() {
  await getAuthWithPermissionOrRedirect("events.read")

  const addresses = await prisma.address.findMany({
    include: {
      cities: {
        select: {
          name: true
        }
      },
      states: {
        select: {
          name: true,
          uf: true
        }
      }
    },
    orderBy: [
      { states: { name: 'asc' } },
      { cities: { name: 'asc' } },
      { street: 'asc' }
    ]
  })

  return addresses.map(address => ({
    id: address.id,
    label: `${address.street}, ${address.number} - ${address.cities.name}/${address.states.uf}`,
    street: address.street,
    number: address.number,
    complement: address.complement,
    postal_code: address.postal_code,
    city: address.cities.name,
    state: address.states.name,
    uf: address.states.uf
  }))
}

// Buscar estados para filtros
export async function getAvailableStates() {
  await getAuthWithPermissionOrRedirect("events.read")

  const states = await prisma.states.findMany({
    select: {
      id: true,
      name: true,
      uf: true
    },
    orderBy: { name: 'asc' }
  })

  return states
}

// Buscar cidades por estado
export async function getAvailableCitiesByState(stateId: string) {
  await getAuthWithPermissionOrRedirect("events.read")

  const cities = await prisma.cities.findMany({
    where: { stateId },
    select: {
      id: true,
      name: true
    },
    orderBy: { name: 'asc' }
  })

  return cities
}