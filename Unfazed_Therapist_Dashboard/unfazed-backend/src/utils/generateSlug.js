function generateSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(value, Model, excludeId) {
  const base = generateSlug(value) || 'therapist';
  let slug = base;
  let suffix = 2;
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

module.exports = generateSlug;
module.exports.generateUniqueSlug = generateUniqueSlug;
