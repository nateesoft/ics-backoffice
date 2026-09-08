import { FindOptionsWhere, Repository } from 'typeorm';

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || 'data';
}

export async function generateUniqueSlug<T extends { slug: string }>(
  repo: Repository<T>,
  name: string,
): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await repo.findOne({ where: { slug } as FindOptionsWhere<T> })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}
