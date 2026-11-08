package tg.ipnetinstitute.technology.common.response;

import java.util.List;

public record PageResponse<T>(
        List<T> elements,
        int page,
        int taille,
        long totalElements,
        int totalPages,
        boolean premiere,
        boolean derniere
) {
    public static <T> PageResponse<T> de(org.springframework.data.domain.Page<T> pageData) {
        return new PageResponse<>(
                pageData.getContent(),
                pageData.getNumber(),
                pageData.getSize(),
                pageData.getTotalElements(),
                pageData.getTotalPages(),
                pageData.isFirst(),
                pageData.isLast()
        );
    }
}
