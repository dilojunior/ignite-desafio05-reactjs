import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });
  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState();

  async function loadMorePosts(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }
    const postsResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );
    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page);

    const newPosts = postsResults.results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      } as Post;
    });
    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>spacetraveling | news</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a href="/">
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <ul>
                  <li>
                    <FiCalendar size={20} />
                    <time>{post.first_publication_date}</time>
                  </li>
                  <li>
                    <FiUser size={20} /> <span>{post.data.author}</span>
                  </li>
                </ul>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button
              className={styles.buttonLoadPosts}
              type="button"
              onClick={() => {
                loadMorePosts();
              }}
            >
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 2,
    }
  );

  const { results } = postsResponse;
  const formattedResults = results.map((post: Post) => {
    const { title, subtitle, author } = post.data;
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title,
        subtitle,
        author,
      },
    };
  });

  const nextPage = postsResponse.next_page ? postsResponse.next_page : null;
  const postsPagination: PostPagination = {
    next_page: nextPage,
    results: formattedResults,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
