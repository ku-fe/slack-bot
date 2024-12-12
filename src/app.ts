import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import ogs from 'open-graph-scraper';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

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
        private_metadata: body.channel_id,
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
                  value: 'javascript'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'TypeScript'
                  },
                  value: 'typescript'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'React'
                  },
                  value: 'react'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Frontend'
                  },
                  value: 'frontend'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Backend'
                  },
                  value: 'backend'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'DevOps'
                  },
                  value: 'devops'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'AI'
                  },
                  value: 'ai'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '디자인'
                  },
                  value: 'design'
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '기타'
                  },
                  value: 'etc'
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
  const channelId = view.private_metadata;
  
  try {
    const { result } = await ogs({ url });
    const { ogImage, ogTitle, ogDescription, ogUrl } = result;
    const imageUrl = ogImage?.[0]?.url ?? '';

    const { error } = await supabase
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

    if (error) throw error;
    
    const tagText = selectedTags.length > 0 
      ? `\n*태그:* ${selectedTags.map(tag => `#${tag.text.text}`).join(' ')}` 
      : '';

    await client.chat.postMessage({
      channel: channelId,
      text: `새로운 아티클이 추가되었습니다: ${ogTitle ?? '제목 없음'}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*<@${body.user.id}>님이 새로운 아티클을 추가했습니다*\n<${url}|${ogTitle ?? '제목 없음'}>${tagText}`
          }
        }
      ]
    });

  } catch (error) {
    console.error(error);
    await client.chat.postMessage({
      channel: body.user.id,
      text: '아티클 저장 중 오류가 발생했습니다.'
    });
  }
});

(async () => {
  await app.start();
  console.log('⚡️ Slack bot is running with Socket Mode!');
})();
