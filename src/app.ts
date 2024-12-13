import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import ogs from 'open-graph-scraper';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const ARTICLES_CHANNEL_ID = process.env.ARTICLES_CHANNEL_ID!;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

app.command('/아티클', async ({ ack, body, client }) => {
  await ack();
  
  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'article_modal',
        private_metadata: ARTICLES_CHANNEL_ID,
        title: {
          type: 'plain_text',
          text: '아티클 추가'
        },
        submit: {
          type: 'plain_text',
          text: '제출'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'article_url_block',
            element: {
              type: 'plain_text_input',
              action_id: 'article_url_input',
              placeholder: {
                type: 'plain_text',
                text: 'URL을 입력해주세요'
              }
            },
            label: {
              type: 'plain_text',
              text: '아티클 URL'
            }
          },
          {
            type: 'input',
            block_id: 'article_tags_block',
            element: {
              type: 'multi_static_select',
              action_id: 'article_tags_input',
              placeholder: {
                type: 'plain_text',
                text: '태그를 선택해주세요'
              },
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'JavaScript'
                  },
                  value: 'JavaScript'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'TypeScript'
                  },
                  value: 'TypeScript'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'React'
                  },
                  value: 'React'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Frontend'
                  },
                  value: 'Frontend'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Backend'
                  },
                  value: 'Backend'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'DevOps'
                  },
                  value: 'DevOps'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'AI'
                  },
                  value: 'AI'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '디자인'
                  },
                  value: '디자인'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '기타'
                  },
                  value: '기타'
                }
              ]
            },
            label: {
              type: 'plain_text',
              text: '태그'
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error(error);
  }
});


app.view('article_modal', async ({ ack, body, view, client }) => {
  await ack();

  const url = view.state.values.article_url_block.article_url_input.value ?? '';
  const selectedTags = view.state.values.article_tags_block.article_tags_input.selected_options ?? [];
  const articlesChannelId = ARTICLES_CHANNEL_ID;
  
  try {
    // 1. URL이 이미 존재하는지 확인
    const { data: existingArticle } = await supabase
      .from('articles_metadata')
      .select('url')
      .eq('url', url)
      .single();

    if (existingArticle) {
      await client.chat.postMessage({
        channel: body.user.id,
        text: '이미 등록된 URL입니다.'
      });
      return;
    }

    // 2. Open Graph 데이터 가져오기
    const { error: ogsError, result } = await ogs({ url });
    
    if (ogsError) {
      throw new Error('URL 메타데이터를 가져오는데 실패했습니다.');
    }

    const { ogImage, ogTitle, ogDescription } = result;
    const imageUrl = ogImage?.[0]?.url ?? '';

    // 3. Supabase에 데이터 저장
    const { error: insertError } = await supabase
      .from('articles_metadata')
      .insert([
        {
          url: url,
          title: ogTitle ?? '',
          description: ogDescription ?? '',
          image_url: imageUrl,
          tags: selectedTags.map(tag => tag.value),
          created_at: new Date().toISOString()
        }
      ]);

    if (insertError) {
      throw new Error('데이터베이스 저장 중 오류가 발생했습니다.');
    }

    // 4. 아티클 채널에 메시지 전송
    await client.chat.postMessage({
      channel: articlesChannelId,
      text: `새로운 아티클이 추가되었습니다: ${ogTitle ?? '제목 없음'}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*<@${body.user.id}>님이 새로운 아티클을 추가했습니다*\n<${url}|${ogTitle ?? '제목 없음'}>`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `태그: ${selectedTags.map(tag => `\`${tag.value}\``).join(', ')}`
            }
          ]
        }
      ]
    });

    // 5. 사용자에게 DM으로 성공 메시지 전송
    await client.chat.postMessage({
      channel: body.user.id,
      text: `아티클이 성공적으로 <#${articlesChannelId}>에 추가되었습니다.`
    });

  } catch (error) {
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '아티클 저장 중 알 수 없는 오류가 발생했습니다.';

    await client.chat.postMessage({
      channel: body.user.id,
      text: errorMessage
    });
  }
});

(async () => {
  await app.start();
  console.log('⚡️ Slack bot is running with Socket Mode!');
})();
