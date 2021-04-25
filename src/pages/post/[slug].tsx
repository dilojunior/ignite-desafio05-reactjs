/* eslint-disable react/no-danger */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Header from '../../components/Header';
import Comments from '../../components/Comments';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost: Post;
  prevPost: Post;
  preview: boolean;
}

export default function Post({
  post,
  nextPost = null,
  prevPost = null,
  preview = false,
}: PostProps): JSX.Element {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    const headingCount = contentItem.heading.split(' ').length;

    total += headingCount;

    const bodyWords = contentItem.body.map(item => {
      return item.text.split(' ').length;
    });
    bodyWords.map(word => (total += word));
    return total;
  }, 0);

  const timeToRead = Math.ceil(totalWords / 200);

  const postData = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  let editedData = null;
  if (post.last_publication_date) {
    editedData = format(
      new Date(post.last_publication_date),
      "dd MMM yyyy 'às' hh:mm'hrs'",
      {
        locale: ptBR,
      }
    );
  }

  const router = useRouter();
  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="post banner" />
      </div>
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <ul className={styles.postAttributes}>
            <li>
              <FiCalendar />
              {postData}
            </li>
            <li>
              <FiUser />
              {post.data.author}
            </li>
            <li>
              <FiClock />
              <time>{`${timeToRead} min`} </time>
            </li>
          </ul>
          {editedData ? (
            <p className={styles.editedData}> * editado em {editedData} </p>
          ) : (
            ''
          )}

          {post.data.content.map(content => {
            return (
              <section className={styles.postContent} key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </section>
            );
          })}
        </article>
        <div className={styles.postEnd}>
          <div className={styles.prevNextPosts}>
            <ul>
              {prevPost ? (
                <li>
                  <h3>{prevPost.data.title}</h3>
                  <Link href={`/post/${prevPost.uid}`}>
                    <a>Post anterior</a>
                  </Link>
                </li>
              ) : (
                <li>
                  <h3> </h3>
                  <Link href="/">
                    <a> </a>
                  </Link>
                </li>
              )}
              {nextPost ? (
                <li>
                  <h3>{nextPost.data.title}</h3>
                  <Link href={`/post/${nextPost.uid}`}>
                    <a>Próximo post</a>
                  </Link>
                </li>
              ) : (
                <li>
                  <h3> </h3>
                  <Link href="/">
                    <a> </a>
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <Comments />
          </div>
          {preview && (
            <aside className={styles.previewMode}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);
  return {
    paths: posts.results.map(post => {
      return {
        params: {
          slug: post.uid,
        },
      };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date ?? null,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  const nextResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const prevResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = nextResponse?.results[0] || null;
  const prevPost = prevResponse?.results[0] || null;

  return {
    props: {
      post,
      nextPost,
      prevPost,
      preview,
    },
  };
};
