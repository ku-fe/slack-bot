import ogs from "open-graph-scraper";
import { getImageUrl } from "../utils/og-utils";
import { supabase } from "../libs/supabase";
import { slackApp } from "../libs/slack";
import { JOBS_CHANNEL_ID } from "../constants";

export const jobHandler = () => {
  slackApp.command('/채용공고', async ({ ack, body, client }) => {
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


  slackApp.view('job_modal', async ({ ack, body, view, client }) => {
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

      const { result } = await ogs({ url });
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
            image_url: imageUrl,
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
}