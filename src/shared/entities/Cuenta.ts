import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Check } from 'typeorm';
import { Moneda } from './Moneda';

@Entity('Cuenta')
@Check(`id_cuenta IN (1, 2, 3, 4, 5, 6)`)
@Check(`nombre IN ('Efectivo USD', 'Efectivo CUP', 'CUP Transferencia', 'Saldo Coinex', 'Saldo QvaPay', 'Saldo MPay')`)
export class Cuenta {
  @PrimaryColumn({ type: 'numeric' })
  id_cuenta!: number;

  @Column({ type: 'varchar', length: 50 })
  nombre!: string;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'codigo_moneda', referencedColumnName: 'codigo' })
  moneda!: Moneda;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  saldo!: number;
}