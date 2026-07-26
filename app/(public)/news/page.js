import Link from 'next/link';
import { fetchFromDato } from '../../../lib/datocms';
import { NEWS_LIST_QUERY } from '../../../lib/queries';

export const revalidate = 3600;

export const metadata = {
  title: 'News — Fox and Lion',
};

export default async function NewsListPage() {
  const data = await fetchFromDato(NEWS_LIST_QUERY);
  const posts = data.allNewsPosts;

  return (
    <div className="container">
      <h1>News</h1>
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
              <Link href={`/news/${post.slug}`}>{post.title}</Link>
            </h2>
          </li>
        ))}
      </ul>
    </div>
  );
}
