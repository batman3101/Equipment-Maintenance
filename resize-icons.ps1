# PowerShell 스크립트로 이미지 리사이징
Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Width,
        [int]$Height
    )
    
    try {
        # 원본 이미지 로드
        $originalImage = [System.Drawing.Image]::FromFile($InputPath)
        
        # 새로운 크기로 비트맵 생성
        $resizedImage = New-Object System.Drawing.Bitmap($Width, $Height)
        
        # 그래픽 객체 생성 및 고품질 설정
        $graphics = [System.Drawing.Graphics]::FromImage($resizedImage)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        
        # 이미지 그리기
        $graphics.DrawImage($originalImage, 0, 0, $Width, $Height)
        
        # 저장
        $resizedImage.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # 리소스 정리
        $graphics.Dispose()
        $resizedImage.Dispose()
        $originalImage.Dispose()
        
        Write-Host "생성 완료: $OutputPath ($Width x $Height)"
    }
    catch {
        Write-Error "이미지 리사이징 실패: $_"
    }
}

# PWA에 필요한 아이콘 사이즈들 생성
$inputFile = "1000002672.png"

if (Test-Path $inputFile) {
    Write-Host "PWA 아이콘 생성 중..."
    
    # 기본 PWA 아이콘들
    Resize-Image -InputPath $inputFile -OutputPath "icon-192x192.png" -Width 192 -Height 192
    Resize-Image -InputPath $inputFile -OutputPath "icon-512x512.png" -Width 512 -Height 512
    
    # 추가 아이콘 사이즈들
    Resize-Image -InputPath $inputFile -OutputPath "icon-72x72.png" -Width 72 -Height 72
    Resize-Image -InputPath $inputFile -OutputPath "icon-96x96.png" -Width 96 -Height 96
    Resize-Image -InputPath $inputFile -OutputPath "icon-128x128.png" -Width 128 -Height 128
    Resize-Image -InputPath $inputFile -OutputPath "icon-144x144.png" -Width 144 -Height 144
    Resize-Image -InputPath $inputFile -OutputPath "icon-152x152.png" -Width 152 -Height 152
    Resize-Image -InputPath $inputFile -OutputPath "icon-384x384.png" -Width 384 -Height 384
    
    # 파비콘
    Resize-Image -InputPath $inputFile -OutputPath "favicon-16x16.png" -Width 16 -Height 16
    Resize-Image -InputPath $inputFile -OutputPath "favicon-32x32.png" -Width 32 -Height 32
    
    # Apple Touch 아이콘
    Resize-Image -InputPath $inputFile -OutputPath "apple-touch-icon.png" -Width 180 -Height 180
    
    Write-Host "모든 아이콘 생성 완료!"
} else {
    Write-Error "원본 이미지 파일을 찾을 수 없습니다: $inputFile"
}