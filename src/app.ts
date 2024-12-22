import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import ogs from 'open-graph-scraper';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const ARTICLES_CHANNEL_ID = process.env.ARTICLES_CHANNEL_ID!;
const JOBS_CHANNEL_ID = process.env.JOBS_CHANNEL_ID!;

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

app.command('/채용공고', async ({ ack, body, client }) => {
  await ack();
  
  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'job_modal',
        private_metadata: JOBS_CHANNEL_ID,
        title: {
          type: 'plain_text',
          text: '채용공고 추가'
        },
        submit: {
          type: 'plain_text',
          text: '제출'
        },
        blocks: [
          {
            type: 'input',
            block_id: 'job_url_block',
            element: {
              type: 'plain_text_input',
              action_id: 'job_url_input',
              placeholder: {
                type: 'plain_text',
                text: '채용공고 URL을 입력해주세요'
              }
            },
            label: {
              type: 'plain_text',
              text: '채용공고 URL'
            }
          },
          {
            type: 'input',
            block_id: 'company_name_block',
            element: {
              type: 'plain_text_input',
              action_id: 'company_name_input',
              placeholder: {
                type: 'plain_text',
                text: '회사명을 입력해주세요'
              }
            },
            label: {
              type: 'plain_text',
              text: '회사명'
            }
          },
          {
            type: 'input',
            block_id: 'position_block',
            element: {
              type: 'plain_text_input',
              action_id: 'position_input',
              placeholder: {
                type: 'plain_text',
                text: '채용 포지션을 입력해주세요'
              }
            },
            label: {
              type: 'plain_text',
              text: '채용 포지션'
            }
          },
          {
            type: 'input',
            block_id: 'job_type_block',
            element: {
              type: 'static_select',
              action_id: 'job_type_input',
              placeholder: {
                type: 'plain_text',
                text: '고용형태를 선택해주세요'
              },
              options: [
                {
                  text: { type: 'plain_text', text: '정규직' },
                  value: '정규직'
                },
                {
                  text: { type: 'plain_text', text: '계약직' },
                  value: '계약직'
                },
                {
                  text: { type: 'plain_text', text: '인턴' },
                  value: '인턴'
                }
              ]
            },
            label: {
              type: 'plain_text',
              text: '고용형태'
            }
          },
          {
            type: 'input',
            block_id: 'experience_block',
            element: {
              type: 'plain_text_input',
              action_id: 'experience_input',
              placeholder: {
                type: 'plain_text',
                text: '예: 신입, 3년 이상, 경력무관 등'
              }
            },
            label: {
              type: 'plain_text',
              text: '요구 경력'
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
    const { error: ogsError, result } = await ogs({ 
      url,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      },
      onlyGetOpenGraphInfo: false,
    });
    
    if (ogsError) {
      throw new Error('URL 메타데이터를 가져오는데 실패했습니다.');
    }

    const getImageUrl = (result: any) => {
      // 기존 OG 이미지 체크
      if (result.ogImage?.[0]?.url) {
        try {
          return new URL(result.ogImage[0].url, url).toString();
        } catch (e) {
          console.error('OG Image URL parsing failed:', e);
        }
      }
      
      // Twitter 이미지 체크
      if (result.twitterImage?.[0]?.url) {
        try {
          return new URL(result.twitterImage[0].url, url).toString();
        } catch (e) {
          console.error('Twitter Image URL parsing failed:', e);
        }
      }
      
      // HTML에서 img 태그 찾기
      if (result.html) {
        // 로고 이미지 찾기
        const logoMatch = result.html.match(/<img[^>]+src="([^"]*logo[^"]*\.(?:png|jpg|jpeg|gif))"/i);
        if (logoMatch?.[1]) {
          try {
            return new URL(logoMatch[1], url).toString();
          } catch (e) {
            console.error('Logo Image URL parsing failed:', e);
          }
        }
        
        // 일반 이미지 찾기
        const imgMatch = result.html.match(/<img[^>]+src="([^"]+\.(?:png|jpg|jpeg|gif))"/i);
        if (imgMatch?.[1]) {
          try {
            return new URL(imgMatch[1], url).toString();
          } catch (e) {
            console.error('General Image URL parsing failed:', e);
          }
        }
      }
      
      return '';
    };

    const imageUrl = getImageUrl(result);

    // 3. Supabase에 데이터 저장
    const { error: insertError } = await supabase
      .from('articles_metadata')
      .insert([
        {
          url: url,
          title: result.ogTitle ?? '',
          description: result.ogDescription ?? '',
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
      text: `새로운 아티클이 추가되었습니다: ${result.ogTitle ?? '제목 없음'}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*<@${body.user.id}>님이 새로운 아티클을 추가했습니다*\n<${url}|${result.ogTitle ?? '제목 없음'}>`
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

    // 5. 사용자에게 DM으로 성 메시지 전송
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

app.view('job_modal', async ({ ack, body, view, client }) => {
  await ack();

  const url = view.state.values.job_url_block.job_url_input.value ?? '';
  const companyName = view.state.values.company_name_block.company_name_input.value ?? '';
  const position = view.state.values.position_block.position_input.value ?? '';
  const jobType = view.state.values.job_type_block.job_type_input.selected_option?.value ?? '';
  const experience = view.state.values.experience_block.experience_input.value ?? '';
  
  try {
    // 1. URL이 이미 존재하는지 확인
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('url')
      .eq('url', url)
      .single();

    if (existingJob) {
      await client.chat.postMessage({
        channel: body.user.id,
        text: '이미 등록된 채용공고입다.'
      });
      return;
    }

    const { error: ogsError, result } = await ogs({ 
      url,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      },
      onlyGetOpenGraphInfo: false,
    });

    // getImageUrl 함수를 재사용하여 이미지 URL 추출
    const getImageUrl = (result: any) => {
      if (result.ogImage?.[0]?.url) {
        return new URL(result.ogImage[0].url, url).toString();
      }
      
      if (result.twitterImage?.[0]?.url) {
        return new URL(result.twitterImage[0].url, url).toString();
      }
      
      if (result.customMetaTags) {
        const imageTag = result.customMetaTags.find((tag: any) => 
          tag.name === 'image' || tag.property === 'image'
        );
        if (imageTag?.content) {
          return new URL(imageTag.content, url).toString();
        }
      }
      
      // 추가: img 태그에서 이미지 찾기
      if (result.html) {
        const imgMatch = result.html.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch?.[1]) {
          return new URL(imgMatch[1], url).toString();
        }
      }
      
      return '';
    };

    const imageUrl = getImageUrl(result);

    // 2. Supabase에 데이터 저장
    const { error: insertError } = await supabase
      .from('jobs')
      .insert([
        {
          url,
          company_name: companyName,
          position,
          job_type: jobType,
          experience,
          image_url: imageUrl, // ogImage?.[0]?.url 대신 getImageUrl 함수 사용
          title: result.ogTitle ?? '',
          description: result.ogDescription ?? '',
          created_at: new Date().toISOString(),
        }
      ]);

    if (insertError) {
      throw new Error('데이터베이스 저장 중 오류가 발생했습니다.');
    }

    // 3. 채용공고 채널에 메시지 전송
    await client.chat.postMessage({
      channel: JOBS_CHANNEL_ID,
      text: `새로운 채용공고가 등록되었습니다! - ${companyName}의 ${position} 포지션`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*새로운 채용공고가 등록되었습니다!*\n*회사:* ${companyName}\n*포지션:* ${position}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*고용형태:* ${jobType}\n*요구경력:* ${experience}\n*URL:* <${url}|채용공고 바로가기>`
          }
        },
      ]
    });

    // 4. 사용자에게 DM으로 성공 메시지 전송
    await client.chat.postMessage({
      channel: body.user.id,
      text: `채용공고가 성공적으로 <#${JOBS_CHANNEL_ID}>에 추가되었습니다.`
    });

  } catch (error) {
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : '채용공고 저장 중 알 수 없는 오류가 발생했습니다.';

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
