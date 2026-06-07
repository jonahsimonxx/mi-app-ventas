import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tasa_cambio_historico')
export class TasaCambioHistorico {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date', unique: true })
  fecha!: string;

  @Column({ type: 'numeric', precision: 10, scale: 4 })
  usd_to_cup!: number;

  @Column({ type: 'numeric', precision: 10, scale: 4, nullable: true })
  eur_to_cup?: number;

  @Column({ type: 'numeric', precision: 10, scale: 4, nullable: true })
  gbp_to_cup?: number;

  @Column({ type: 'varchar', length: 20, default: 'manual' })
  fuente!: string;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at!: Date;
}
