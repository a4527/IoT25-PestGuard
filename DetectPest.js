#include <Wire.h>
#include <algorithm>

#define SENSOR_ADDR 0x40      // GP2Y0E03 I2C 주소 (기본값)
#define RCWL_PIN 14           // RCWL-0516 레이더 센서 입력 핀 번호

const int windowSize = 9;     // 거리 측정 슬라이딩 윈도우 크기
int distanceWindow[windowSize]; // 최근 거리값 저장 배열
int index = 0;                // 현재 저장 위치 인덱스
bool filled = false;          // 배열이 한 바퀴 돌아 채워졌는지 여부

// 중앙값 계산 함수
float getMedian(int* arr, int size) {
  int sorted[size];
  memcpy(sorted, arr, size * sizeof(int));
  std::sort(sorted, sorted + size); // 배열 정렬

  if (size % 2 == 0)
    return (sorted[size / 2 - 1] + sorted[size / 2]) / 2.0;
  else
    return sorted[size / 2];
}

// MAD (Median Absolute Deviation) 계산 함수
float getMAD(int* arr, int size, float median) {
  float deviations[size];
  for (int i = 0; i < size; i++) {
    deviations[i] = abs(arr[i] - median); // 각 값과 중앙값의 편차
  }
  std::sort(deviations, deviations + size); // 편차 정렬

  if (size % 2 == 0)
    return (deviations[size / 2 - 1] + deviations[size / 2]) / 2.0;
  else
    return deviations[size / 2];
}

// GP2Y0E03 거리 센서 데이터 읽기 함수
int readGP2Y0E03() {
  Wire.beginTransmission(SENSOR_ADDR);
  Wire.write(0x5E); // 거리값 레지스터 주소
  Wire.endTransmission();
  Wire.requestFrom(SENSOR_ADDR, 2); // 2바이트 거리값 요청

  if (Wire.available() >= 2) {
    int high = Wire.read();
    int low = Wire.read();
    return ((high << 8) | low) >> 3; // 13비트 정규화
  }
  return -1; // 읽기 실패 시 -1 반환
}

void setup() {
  Wire.begin();
  Serial.begin(115200);         // 시리얼 통신 시작
  pinMode(RCWL_PIN, INPUT);     // 레이더 센서 입력 핀 설정
}

void loop() {
  int raw = readGP2Y0E03();     // 거리 센서 값 읽기
  if (raw <= 0) return;         // 유효하지 않은 값이면 무시

  // 거리값을 슬라이딩 윈도우에 저장
  distanceWindow[index] = raw;
  index = (index + 1) % windowSize;
  if (index == 0) filled = true;

  // 윈도우가 가득 찼을 때만 분석 시작
  if (filled) {
    float median = getMedian(distanceWindow, windowSize);           // 중앙값 계산
    float mad = getMAD(distanceWindow, windowSize, median);         // MAD 계산
    float current = raw;                                            // 현재값
    bool radarDetected = digitalRead(RCWL_PIN);                     // RCWL 레이더 감지 여부

    // 현재값이 중앙값 ± 3*MAD를 벗어났고, 레이더 감지되었을 때 → 바퀴벌레 감지
    if (abs(current - median) > 3 * mad && radarDetected) {
    
      /*
      
		      벌레 감지됨
		      
      */
    }
  }

  delay(100); // 센서 측정 주기: 100ms
}
