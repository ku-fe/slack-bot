import { OgObject } from "open-graph-scraper/types/lib/types";

/**
 * Open Graph 데이터를 기반으로 이미지 URL을 추출하는 함수
 * @param result - Open Graph 데이터
 * @returns 이미지 URL
 */
export const getImageUrl = (result: OgObject): string => {
  // ogImage를 가지고 있는 경우
  if (result.ogImage?.[0]?.url) {
    // ogImage가 절대 경로인 경우
    if (result.ogImage[0].url.startsWith('http')) {
      return result.ogImage[0].url;
    }
    // ogImage가 상대 경로인 경우
    return result.ogUrl + result.ogImage[0].url;
  }

  // ogImage를 가지고 있지 않은 경우
  return result.favicon ?? '';
}