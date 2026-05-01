export type UnidadMedida = string

export type Database = {
  public: {
    Tables: {
      servicios: {
        Row: {
          id: string
          nombre: string
          estado: 'activo' | 'inactivo'
          fecha_creacion: string
          fecha_actualizacion: string
        }
        Insert: {
          id?: string
          nombre: string
          estado?: 'activo' | 'inactivo'
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
        Update: {
          id?: string
          nombre?: string
          estado?: 'activo' | 'inactivo'
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
        Relationships: []
      }
      servicios_precios: {
        Row: {
          id: string
          servicio_id: string
          precio_m2: number
          fecha_desde: string
          fecha_hasta: string | null
          usuario_id: string | null
        }
        Insert: {
          id?: string
          servicio_id: string
          precio_m2: number
          fecha_desde?: string
          fecha_hasta?: string | null
          usuario_id?: string | null
        }
        Update: {
          id?: string
          servicio_id?: string
          precio_m2?: number
          fecha_desde?: string
          fecha_hasta?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'servicios_precios_servicio_id_fkey'
            columns: ['servicio_id']
            isOneToOne: false
            referencedRelation: 'servicios'
            referencedColumns: ['id']
          },
        ]
      }
      materiales: {
        Row: {
          id: string
          nombre: string
          unidad: UnidadMedida
          estado: 'activo' | 'inactivo'
          fecha_creacion: string
          fecha_actualizacion: string
        }
        Insert: {
          id?: string
          nombre: string
          unidad: UnidadMedida
          estado?: 'activo' | 'inactivo'
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
        Update: {
          id?: string
          nombre?: string
          unidad?: UnidadMedida
          estado?: 'activo' | 'inactivo'
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
        Relationships: []
      }
      materiales_precios: {
        Row: {
          id: string
          material_id: string
          precio: number
          fecha_desde: string
          fecha_hasta: string | null
          usuario_id: string | null
        }
        Insert: {
          id?: string
          material_id: string
          precio: number
          fecha_desde?: string
          fecha_hasta?: string | null
          usuario_id?: string | null
        }
        Update: {
          id?: string
          material_id?: string
          precio?: number
          fecha_desde?: string
          fecha_hasta?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'materiales_precios_material_id_fkey'
            columns: ['material_id']
            isOneToOne: false
            referencedRelation: 'materiales'
            referencedColumns: ['id']
          },
        ]
      }
      mano_obra_tipos: {
        Row: {
          id: string
          tipo: string
          estado: 'activo' | 'inactivo'
          fecha_creacion: string
          fecha_actualizacion: string
        }
        Insert: {
          id?: string
          tipo: string
          estado?: 'activo' | 'inactivo'
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
        Update: {
          id?: string
          tipo?: string
          estado?: 'activo' | 'inactivo'
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
        Relationships: []
      }
      mano_obra_costos: {
        Row: {
          id: string
          tipo_id: string
          costo_diario: number
          fecha_desde: string
          fecha_hasta: string | null
          usuario_id: string | null
        }
        Insert: {
          id?: string
          tipo_id: string
          costo_diario: number
          fecha_desde?: string
          fecha_hasta?: string | null
          usuario_id?: string | null
        }
        Update: {
          id?: string
          tipo_id?: string
          costo_diario?: number
          fecha_desde?: string
          fecha_hasta?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'mano_obra_costos_tipo_id_fkey'
            columns: ['tipo_id']
            isOneToOne: false
            referencedRelation: 'mano_obra_tipos'
            referencedColumns: ['id']
          },
        ]
      }
      unidades_medida: {
        Row: {
          id: string
          nombre: string
          activo: boolean
          orden: number
          fecha_creacion: string
        }
        Insert: {
          id?: string
          nombre: string
          activo?: boolean
          orden?: number
          fecha_creacion?: string
        }
        Update: {
          id?: string
          nombre?: string
          activo?: boolean
          orden?: number
          fecha_creacion?: string
        }
        Relationships: []
      }
      presupuestos: {
        Row: {
          id: string
          numero: string | null
          estado: 'emitido' | 'aprobado' | 'finalizado'
          cliente_razon_social: string | null
          cliente_cuit: string | null
          cliente_telefono: string | null
          cliente_direccion: string | null
          cliente_administrador: string | null
          cliente_administrador_cuit: string | null
          cliente_email: string | null
          edif_anios: number | null
          edif_altura: number | null
          edif_color: string | null
          edif_acabado: string[]
          edif_m2: number | null
          edif_condicion_estructural: string | null
          edif_tipologia: string | null
          edif_clase_incendio: string | null
          edif_valor_patrimonial: boolean
          edif_proteccion: string | null
          coef_k: number | null
          observaciones: string | null
          descuento_tipo: 'fijo' | 'porcentaje' | null
          descuento_valor: number | null
          iva_pct: number
          dias_estimados_obra: number | null
          usuario_id: string | null
          fecha_creacion: string
          fecha_actualizacion: string
          fecha_aprobacion: string | null
          factura_asociada_id: string | null
        }
        Insert: {
          id?: string
          numero?: string | null
          estado?: 'emitido' | 'aprobado' | 'finalizado'
          cliente_razon_social?: string | null
          cliente_cuit?: string | null
          cliente_telefono?: string | null
          cliente_direccion?: string | null
          cliente_administrador?: string | null
          cliente_administrador_cuit?: string | null
          cliente_email?: string | null
          edif_anios?: number | null
          edif_altura?: number | null
          edif_color?: string | null
          edif_acabado?: string[]
          edif_m2?: number | null
          edif_condicion_estructural?: string | null
          edif_tipologia?: string | null
          edif_clase_incendio?: string | null
          edif_valor_patrimonial?: boolean
          edif_proteccion?: string | null
          coef_k?: number | null
          observaciones?: string | null
          descuento_tipo?: 'fijo' | 'porcentaje' | null
          descuento_valor?: number | null
          iva_pct?: number
          dias_estimados_obra?: number | null
          usuario_id?: string | null
          fecha_creacion?: string
          fecha_actualizacion?: string
          fecha_aprobacion?: string | null
          factura_asociada_id?: string | null
        }
        Update: {
          id?: string
          numero?: string | null
          estado?: 'emitido' | 'aprobado' | 'finalizado'
          cliente_razon_social?: string | null
          cliente_cuit?: string | null
          cliente_telefono?: string | null
          cliente_direccion?: string | null
          cliente_administrador?: string | null
          cliente_administrador_cuit?: string | null
          cliente_email?: string | null
          edif_anios?: number | null
          edif_altura?: number | null
          edif_color?: string | null
          edif_acabado?: string[]
          edif_m2?: number | null
          edif_condicion_estructural?: string | null
          edif_tipologia?: string | null
          edif_clase_incendio?: string | null
          edif_valor_patrimonial?: boolean
          edif_proteccion?: string | null
          coef_k?: number | null
          observaciones?: string | null
          descuento_tipo?: 'fijo' | 'porcentaje' | null
          descuento_valor?: number | null
          iva_pct?: number
          dias_estimados_obra?: number | null
          usuario_id?: string | null
          fecha_creacion?: string
          fecha_actualizacion?: string
          fecha_aprobacion?: string | null
          factura_asociada_id?: string | null
        }
        Relationships: []
      }
      presupuesto_servicios: {
        Row: {
          id: string
          presupuesto_id: string
          servicio_id: string | null
          nombre_snapshot: string
          precio_m2_snapshot: number
          m2_snapshot: number
          k_snapshot: number
          subtotal: number
          es_adicional: boolean
          created_at: string
        }
        Insert: {
          id?: string
          presupuesto_id: string
          servicio_id?: string | null
          nombre_snapshot: string
          precio_m2_snapshot: number
          m2_snapshot: number
          k_snapshot: number
          subtotal: number
          es_adicional?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          presupuesto_id?: string
          servicio_id?: string | null
          nombre_snapshot?: string
          precio_m2_snapshot?: number
          m2_snapshot?: number
          k_snapshot?: number
          subtotal?: number
          es_adicional?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'presupuesto_servicios_presupuesto_id_fkey'
            columns: ['presupuesto_id']
            isOneToOne: false
            referencedRelation: 'presupuestos'
            referencedColumns: ['id']
          },
        ]
      }
      presupuesto_materiales: {
        Row: {
          id: string
          presupuesto_id: string
          material_id: string | null
          nombre_snapshot: string
          unidad_snapshot: string
          precio_snapshot: number
          cantidad: number
          subtotal: number
          es_adicional: boolean
          created_at: string
        }
        Insert: {
          id?: string
          presupuesto_id: string
          material_id?: string | null
          nombre_snapshot: string
          unidad_snapshot: string
          precio_snapshot: number
          cantidad: number
          subtotal: number
          es_adicional?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          presupuesto_id?: string
          material_id?: string | null
          nombre_snapshot?: string
          unidad_snapshot?: string
          precio_snapshot?: number
          cantidad?: number
          subtotal?: number
          es_adicional?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'presupuesto_materiales_presupuesto_id_fkey'
            columns: ['presupuesto_id']
            isOneToOne: false
            referencedRelation: 'presupuestos'
            referencedColumns: ['id']
          },
        ]
      }
      presupuesto_mano_obra: {
        Row: {
          id: string
          presupuesto_id: string
          tipo_id: string | null
          tipo_snapshot: string
          costo_diario_snapshot: number
          cantidad_empleados: number
          es_adicional: boolean
          created_at: string
        }
        Insert: {
          id?: string
          presupuesto_id: string
          tipo_id?: string | null
          tipo_snapshot: string
          costo_diario_snapshot: number
          cantidad_empleados?: number
          es_adicional?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          presupuesto_id?: string
          tipo_id?: string | null
          tipo_snapshot?: string
          costo_diario_snapshot?: number
          cantidad_empleados?: number
          es_adicional?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'presupuesto_mano_obra_presupuesto_id_fkey'
            columns: ['presupuesto_id']
            isOneToOne: false
            referencedRelation: 'presupuestos'
            referencedColumns: ['id']
          },
        ]
      }
      contratos: {
        Row: {
          id: string
          presupuesto_id: string
          nombre_comitente: string | null
          direccion_obra: string | null
          nombre_administrador: string | null
          administrador_dni: string | null
          sector_obra: string | null
          adelanto: number | null
          num_cuotas: number | null
          monto_cuota: number | null
          monto_multa: number | null
          direccion_legal: string | null
          fecha_inicio_obra: string | null
          fecha_firma: string | null
          plan_pago: 'contado' | '60dias' | '90dias' | null
          fecha_cuota_1: string | null
          fecha_cuota_2: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          presupuesto_id: string
          nombre_comitente?: string | null
          direccion_obra?: string | null
          nombre_administrador?: string | null
          administrador_dni?: string | null
          sector_obra?: string | null
          adelanto?: number | null
          num_cuotas?: number | null
          monto_cuota?: number | null
          monto_multa?: number | null
          direccion_legal?: string | null
          fecha_inicio_obra?: string | null
          fecha_firma?: string | null
          plan_pago?: 'contado' | '60dias' | '90dias' | null
          fecha_cuota_1?: string | null
          fecha_cuota_2?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          presupuesto_id?: string
          nombre_comitente?: string | null
          direccion_obra?: string | null
          nombre_administrador?: string | null
          administrador_dni?: string | null
          sector_obra?: string | null
          adelanto?: number | null
          num_cuotas?: number | null
          monto_cuota?: number | null
          monto_multa?: number | null
          direccion_legal?: string | null
          fecha_inicio_obra?: string | null
          fecha_firma?: string | null
          plan_pago?: 'contado' | '60dias' | '90dias' | null
          fecha_cuota_1?: string | null
          fecha_cuota_2?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contratos_presupuesto_id_fkey'
            columns: ['presupuesto_id']
            isOneToOne: true
            referencedRelation: 'presupuestos'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      vista_servicios_con_precio: {
        Row: {
          id: string
          nombre: string
          estado: 'activo' | 'inactivo'
          precio_m2_actual: number | null
          fecha_creacion: string
          fecha_actualizacion: string
        }
        Relationships: []
      }
    }
    Functions: {
      next_presupuesto_numero: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      estado_item: 'activo' | 'inactivo'
    }
  }
}

// ─── Servicios ────────────────────────────────────────────────────────────────

export type Servicio = Database['public']['Tables']['servicios']['Row']
export type ServicioInsert = Database['public']['Tables']['servicios']['Insert']
export type ServicioPrecio = Database['public']['Tables']['servicios_precios']['Row']
export type ServicioConPrecio = Database['public']['Views']['vista_servicios_con_precio']['Row']

// ─── Materiales ───────────────────────────────────────────────────────────────

export type Material = Database['public']['Tables']['materiales']['Row']
export type MaterialInsert = Database['public']['Tables']['materiales']['Insert']
export type MaterialPrecio = Database['public']['Tables']['materiales_precios']['Row']
export type MaterialConPrecio = Material & { precio_actual: number | null }

// ─── Mano de Obra ─────────────────────────────────────────────────────────────

export type ManoDeObraTipo = Database['public']['Tables']['mano_obra_tipos']['Row']
export type ManoDeObraTipoInsert = Database['public']['Tables']['mano_obra_tipos']['Insert']
export type ManoDeObraCosto = Database['public']['Tables']['mano_obra_costos']['Row']
export type ManoDeObraTipoConCosto = ManoDeObraTipo & { costo_diario_actual: number | null }

// ─── Presupuestos ─────────────────────────────────────────────────────────────

export type EstadoPresupuesto = 'emitido' | 'aprobado' | 'finalizado'
export type DescuentoTipo = 'fijo' | 'porcentaje'

export type Presupuesto = Database['public']['Tables']['presupuestos']['Row']
export type PresupuestoServicioItem = Database['public']['Tables']['presupuesto_servicios']['Row']
export type PresupuestoMaterialItem = Database['public']['Tables']['presupuesto_materiales']['Row']
export type PresupuestoManoObraItem = Database['public']['Tables']['presupuesto_mano_obra']['Row']

export interface PresupuestoCompleto extends Presupuesto {
  servicios: PresupuestoServicioItem[]
  materiales: PresupuestoMaterialItem[]
  mano_obra: PresupuestoManoObraItem[]
}

// ─── Tipos de formulario (frontend only) ─────────────────────────────────────

export interface FormServicioItem {
  _key: string
  servicio_id: string
  nombre: string
  precio_m2: number
  es_adicional?: boolean
}

export interface FormMaterialItem {
  _key: string
  material_id: string
  nombre: string
  unidad: string
  precio: number
  cantidad: number
  es_adicional?: boolean
}

export interface FormManoObraItem {
  _key: string
  tipo_id: string
  tipo: string
  costo_diario: number
  cantidad_empleados: number
  es_adicional?: boolean
}

// ─── Contratos ────────────────────────────────────────────────────────────────

export type Contrato = Database['public']['Tables']['contratos']['Row']
