/* eslint-disable camelcase */

export const shorthands = undefined;

export async function up(pgm) {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'text', notNull: true, unique: true },
    username: { type: 'text', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createTable('screenplays', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    title: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createTable('characters', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    screenplay_id: { type: 'uuid', notNull: true, references: 'screenplays(id)', onDelete: 'CASCADE' },
    name: { type: 'text', notNull: true },
    role: { type: 'text', default: '' }
  });

  pgm.createTable('dialogues', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    character_id: { type: 'uuid', notNull: true, references: 'characters(id)', onDelete: 'CASCADE' },
    screenplay_id: { type: 'uuid', notNull: true, references: 'screenplays(id)', onDelete: 'CASCADE' },
    text: { type: 'text', notNull: true },
    scene_number: { type: 'text' },
    page: { type: 'integer' }
  });

  pgm.createTable('sprints', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)' },
    is_active: { type: 'boolean', notNull: true, default: false },
    started_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    ended_at: { type: 'timestamptz' },
    duration_sec: { type: 'integer' }
  });

  pgm.createTable('stash', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)' },
    text: { type: 'text', notNull: true },
    type: { type: 'text', notNull: true },
    word_count: { type: 'integer', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createTable('screenplay_content', {
    screenplay_id: { type: 'uuid', primaryKey: true, references: 'screenplays(id)', onDelete: 'CASCADE' },
    html: { type: 'text', notNull: true, default: '' },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') }
  });
}

export async function down(pgm) {
  pgm.dropTable('screenplay_content');
  pgm.dropTable('stash');
  pgm.dropTable('sprints');
  pgm.dropTable('dialogues');
  pgm.dropTable('characters');
  pgm.dropTable('screenplays');
  pgm.dropTable('users');
  pgm.dropExtension('pgcrypto');
}
