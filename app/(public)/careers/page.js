import Link from 'next/link';
import { fetchFromDato } from '../../../lib/datocms';
import { CAREERS_LIST_QUERY } from '../../../lib/queries';

export const revalidate = 3600;

export const metadata = {
  title: 'Careers — Fox and Lion',
};

export default async function CareersListPage() {
  const data = await fetchFromDato(CAREERS_LIST_QUERY);
  const posts = data.allCareersPosts;

  return (
    <div className="container">
      <h1>Careers</h1>
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.id}>
            <span className="post-meta">
              {new Date(post.publishedDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <h2>
              <Link href={`/careers/${post.slug}`}>{post.title}</Link>
            </h2>
          </li>
        ))}
      </ul>
    </div>
  );
}
